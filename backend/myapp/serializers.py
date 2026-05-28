from rest_framework import serializers
from .models import NormalizedActivityData, RawDataRow, AuditTrail,RawIngestionBatch

class RawDataRowSerializer(serializers.ModelSerializer):
    """
    Serializes the immutable original event data captured during ingestion.
    """
    class Meta:
        model = RawDataRow
        fields = ['id', 'row_index', 'raw_payload', 'processed']


class AuditTrailSerializer(serializers.ModelSerializer):
    """
    Serializes the historical chain of custody for this record.
    Tracks human overrides for transparent auditor verification.
    """
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditTrail
        fields = ['id', 'user_name', 'action', 'previous_values', 'new_values', 'timestamp', 'reason']


class NormalizedActivitySerializer(serializers.ModelSerializer):
    """
    The primary serializer for the Analyst Audit Dashboard.
    Combines normalized carbon metrics with structural lineage context.
    """
    # Embedded data mapping for side-by-side verification in the React drawer
    raw_row_payload = serializers.JSONField(source='raw_row.raw_payload', read_only=True)
    batch_filename = serializers.CharField(source='raw_row.batch.filename', read_only=True)
    ingested_at = serializers.DateTimeField(source='raw_row.batch.ingested_at', read_only=True)
    
    # Audit history stream
    audit_history = AuditTrailSerializer(source='audit_logs', many=True, read_only=True)
    modified_by_name = serializers.CharField(source='last_modified_by.username', read_only=True)

    class Meta:
        model = NormalizedActivityData
        fields = [
            'id',
            'scope_category',
            'activity_type',
            'start_date',
            'end_date',
            'raw_quantity',
            'raw_unit',
            'normalized_quantity',
            'normalized_unit',
            'co2e_metric_tons',
            'emission_factor_used',
            'status',
            'flags',
            'batch_filename',
            'ingested_at',
            'raw_row_payload',
            'audit_history',
            'modified_by_name',
            'updated_at'
        ]
        # Protect integrity metrics from being directly overwritten via standard PUT/PATCH operations.
        # Changes to these fields must happen via the backend pipeline logic or explicitly audited endpoints.
        read_only_fields = [
            'id', 
            'scope_category', 
            'activity_type', 
            'co2e_metric_tons', 
            'emission_factor_used', 
            'flags'
        ]

    def validate(self, data):
        """
        Object-level validation ensuring compliance with the state machine constraints.
        """
        # If the client is updating the status or data, ensure a justification reason is present
        request = self.context.get('request')
        if request and request.method in ['PUT', 'PATCH']:
            change_reason = request.data.get('change_reason')
            if not change_reason or len(change_reason.strip()) < 10:
                raise serializers.ValidationError({
                    "change_reason": "An explicit attestation reason (minimum 10 characters) is required to modify ledger records for audit logs."
                })
        return data


class IngestionBatchSerializer(serializers.ModelSerializer):
    """
    Tracks high-level ingestion sessions and summary stats.
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    source_name = serializers.CharField(source='data_source.name', read_only=True)
    source_type = serializers.CharField(source='data_source.source_type', read_only=True)
    total_rows_count = serializers.SerializerMethodField()

    class Meta:
        model = RawIngestionBatch
        fields = ['id', 'source_name', 'source_type', 'uploaded_by_name', 'filename', 'ingested_at', 'total_rows_count', 'metadata']

    def get_total_rows_count(self, obj):
        return obj.raw_rows.count()