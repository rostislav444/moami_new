from apps.sizes.models import SizeGroup, SizeGrid, Size, SizeInterpretation, SizeProperty, SizePropertyValue
from apps.sizes.data import data
from apps.core.models import Unit


class CreateInitialSizesAbstract:
    class Meta:
        abstract = True

    def create_initial_sizes(self):
        for size_group in data:
            self.create_size_group(size_group)

    def create_size_group(self, size_group_data):
        size_group, _ = SizeGroup.objects.get_or_create(name=size_group_data['name'])
        self.create_size_grids(size_group, size_group_data['grids'])
        self.create_size_properties(size_group, size_group_data['properties'])
        self.create_sizes(size_group, size_group_data['sizes'])

    def create_size_grids(self, size_group, grids):
        size_grids = []
        for grid in grids:
            size_grid, _ = SizeGrid.objects.get_or_create(name=grid)
            size_grids.append(size_grid)
        size_group.grids.set(size_grids)

    def create_size_properties(self, size_group, properties):
        for name, property in properties.items():
            unit, _ = Unit.objects.get_or_create(name=property['unit'])
            SizeProperty.objects.get_or_create(size_group=size_group, name=property['name'], slug=property['slug'],
                                               unit=unit)

    def create_sizes(self, size_group, sizes):
        Size.objects.filter(group=size_group).delete()
        for n, size_data in enumerate(sizes):
            self.create_size(size_group, size_data, n)

    def create_size(self, size_group, size_data, n):
        properties = size_data.pop('properties')
        size, _ = Size.objects.get_or_create(group=size_group, order=n)
        for grid_name, value in size_data.items():
            grid = SizeGrid.objects.get(name=grid_name)
            size_interpretation, _ = SizeInterpretation.objects.get_or_create(size=size, grid=grid, value=value)
        for k, v in properties.items():
            size_property = SizeProperty.objects.get(slug=k)
            SizePropertyValue.objects.get_or_create(size=size, property=size_property, value=v)
