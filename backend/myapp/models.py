from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField  # Use models.JSONField in modern Django

class Organization(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class DataSource(models.Model):
    SOURCE_TYPES = (
        ('SAP', 'SAP ERP Procurement/Fuel'),
        ('UTILITY', 'Utility Portal CSV'),
        ('TRAVEL', 'Corporate Travel Platform'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_sources')
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    is_active = models.BooleanField(default=True)

class RawIngestionBatch(models.Model):
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='batches')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    filename = models.CharField(max_length=255)
    ingested_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

class RawDataRow(models.Model):
    batch = models.ForeignKey(RawIngestionBatch, on_delete=models.CASCADE, related_name='raw_rows')
    row_index = models.IntegerField()
    raw_payload = models.JSONField()  # Unmodified verbatim data
    processed = models.BooleanField(default=False)

class NormalizedActivityData(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('SUSPICIOUS', 'Flagged as Suspicious'),
        ('APPROVED', 'Approved by Analyst'),
        ('LOCKED', 'Locked for Audit'),
    )
    SCOPE_CHOICES = (
        ('SCOPE_1', 'Scope 1 (Direct Emissions)'),
        ('SCOPE_2', 'Scope 2 (Indirect Market Emissions)'),
        ('SCOPE_3', 'Scope 3 (Value Chain Emissions)'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    raw_row = models.OneToOneField(RawDataRow, on_delete=models.CASCADE, related_name='normalized_data')
    
    # Standardized Metadata
    scope_category = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    activity_type = models.CharField(max_length=100) # e.g., "Stationary Combustion - Diesel"
    
    # Time Alignment
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Normalized Values
    raw_quantity = models.DecimalField(max_digits=15, decimal_places=4)
    raw_unit = models.CharField(max_length=50)
    normalized_quantity = models.DecimalField(max_digits=15, decimal_places=4)
    normalized_unit = models.CharField(max_length=50) # Liters, kWh, passenger-km
    
    # Emission Calculation
    co2e_metric_tons = models.DecimalField(max_digits=12, decimal_places=6)
    emission_factor_used = models.CharField(max_length=255)
    
    # Verification State
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    flags = models.JSONField(default=list, blank=True) # Explanations for why it's suspicious
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

class AuditTrail(models.Model):
    activity_record = models.ForeignKey(NormalizedActivityData, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100) # e.g., "STATUS_CHANGE", "QUANTITY_UPDATE"
    previous_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)


class UserProfile(models.Model):
    """
    Extends the built-in Django User model to provide 
    strict multi-tenant scoping for ESG analysts.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userprofile')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users')

    def __str__(self):
        return f"{self.user.username} ({self.organization.name})"