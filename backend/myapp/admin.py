from django.contrib import admin
from .models import UserProfile, Organization, DataSource, RawIngestionBatch, RawDataRow, NormalizedActivityData, AuditTrail

# Register your models here.
admin.site.register(UserProfile);
admin.site.register(Organization);
admin.site.register(DataSource);
admin.site.register(RawIngestionBatch);
admin.site.register(RawDataRow);
admin.site.register(NormalizedActivityData);
admin.site.register(AuditTrail);
