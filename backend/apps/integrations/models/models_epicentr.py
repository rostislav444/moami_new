from django.db import models



class EpicentrAttributeSet(models.Model):
    code = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

class EpicentrAttributeGroup(models.Model):
    attribute_set = models.ForeignKey(EpicentrAttributeSet, on_delete=models.CASCADE, related_name='attribute_groups')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class EpicentrAttribute(models.Model):
    attribute_set = models.ForeignKey(EpicentrAttributeSet, on_delete=models.CASCADE, related_name='attributes')
    attribute_group = models.ForeignKey(EpicentrAttributeGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='attributes')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    type = models.CharField(max_length=64, null=True, blank=True)
    is_system = models.BooleanField(default=False)
    is_required = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name


class EpicentrAttributeOption(models.Model):
    attribute = models.ForeignKey(EpicentrAttribute, on_delete=models.CASCADE, related_name='options')
    code = models.CharField(max_length=255)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class EpicentrProductAttribute(models.Model):
    product = models.ForeignKey('product.Product', on_delete=models.CASCADE, related_name='epicentr_attributes')
    attribute = models.ForeignKey(EpicentrAttribute, on_delete=models.CASCADE, related_name='product_values')
    value_option = models.ForeignKey(EpicentrAttributeOption, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_values')
    value_options = models.ManyToManyField(EpicentrAttributeOption, blank=True, related_name='product_multi_values')
    value_text = models.TextField(null=True, blank=True)
    value_string = models.CharField(max_length=512, null=True, blank=True)
    value_float = models.FloatField(null=True, blank=True)
    value_int = models.IntegerField(null=True, blank=True)
    value_array = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('product', 'attribute')

    def __str__(self):
        return f'{self.product_id} - {self.attribute.name}'


class EpicentrCategories(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    attribute_sets = models.JSONField(default=list)

    def __str__(self):
        return self.name



