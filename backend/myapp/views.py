from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import NormalizedActivityData, RawIngestionBatch, DataSource, AuditTrail
from .serializers import NormalizedActivitySerializer, IngestionBatchSerializer
from .services.normalization import NormalizationPipeline

class IngestionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        source_id = request.data.get('source_id')
        uploaded_file = request.FILES.get('file')
        
        if not source_id or not uploaded_file:
            return Response({"error": "Missing source identifier or data payload"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            data_source = DataSource.objects.get(id=source_id, organization=request.user.userprofile.organization)
            
            with transaction.atomic():
                batch = RawIngestionBatch.objects.create(
                    data_source=data_source,
                    uploaded_by=request.user,
                    filename=uploaded_file.name,
                    metadata={"Content-Type": uploaded_file.content_type,"File-Size": str(uploaded_file.size) + " bytes"}
                )
                
                if data_source.source_type == 'SAP':
                    NormalizationPipeline.process_sap_csv(batch, uploaded_file)
                elif data_source.source_type == 'UTILITY':
                    NormalizationPipeline.process_utility_csv(batch, uploaded_file)
                elif data_source.source_type == 'TRAVEL':
                    NormalizationPipeline.process_travel_json(batch, uploaded_file)

            return Response({"message": f"Successfully ingested batch for review. ID: {batch.id}"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DataReviewViewSet(viewsets.ModelViewSet):
    """
    Exposes analytical review tasks. Overrides updates to ensure audit enforcement.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NormalizedActivitySerializer

    def get_queryset(self):
        return NormalizedActivityData.objects.filter(
            organization=self.request.user.userprofile.organization
        ).select_related('raw_row', 'raw_row__batch')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if instance.status == 'LOCKED':
            return Response({"error": "This record has been signed off and locked for auditor export. Changes prohibited."}, status=status.HTTP_403_FORBIDDEN)

        # Retain original values for the audit logger
        prev_values = {
            "status": instance.status,
            "normalized_quantity": str(instance.normalized_quantity)
        }
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            updated_instance = serializer.save(last_modified_by=request.user)
            
            # Fire verification change hook
            AuditTrail.objects.create(
                activity_record=updated_instance,
                user=request.user,
                action="MANUAL_ANALYST_OVERRIDE",
                previous_values=prev_values,
                new_values={
                    "status": updated_instance.status,
                    "normalized_quantity": str(updated_instance.normalized_quantity)
                },
                reason=request.data.get('change_reason', 'Analyst standard validation review.')
            )

        return Response(serializer.data)