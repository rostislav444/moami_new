from apps.sizes.abstract._createinitialdata import CreateInitialSizesAbstract


class CreateSizes(CreateInitialSizesAbstract):
    def __init__(self):
        self.create_initial_sizes()