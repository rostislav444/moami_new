categories = [
    {
        'name': 'Женская одежда',
        'children': [
            {'name': 'Блузы', 'size_group': 'tops_long_sleeve'},
            {'name': 'Свитера', 'size_group': 'tops_long_sleeve'},
            {'name': 'Костюмы', 'size_group': 'suits'},
            {'name': 'Юбки', 'size_group': 'skirts'},
            {'name': 'Платья', 'size_group': 'dress'},
            {'name': 'Майки ', 'size_group': 'tops_short_sleeve'},
            {'name': 'Брюки', 'size_group': 'pants'},
            {'name': 'Джинсы', 'size_group': 'pants'}
        ]
    },
    {
        'name': 'Верхняя одежда',
        'children': [
            {'name': 'Куртки, пальто, плащи', 'size_group': 'jackets'},
            {'name': 'Пуховики', 'size_group': 'jackets'},
            {'name': 'Шубы', 'size_group': 'jackets'}
        ]
    },
    {
        'name': 'Обувь',
        'children': [
            {'name': 'Босоножки', 'size_group': 'shoes'},
            {'name': 'Сапоги', 'size_group': 'shoes'},
            {'name': 'Туфли', 'size_group': 'shoes'},
        ],
        'size_group': 'shoes'
    },
    # {
    #     'name': 'Аксессуары',
    #     'children': [
    #         {'name': 'Головные уборы', 'size_group': 'Головные уборы женские'},
    #         {'name': 'Ремни и пояса', 'size_group': 'Ремни и пояса женские'}
    #     ]
    # }
]


def get_size_groups():
    size_groups = []
    for item in categories:
        if 'size_group' in item:
            size_groups.append(item['size_group'])
        if 'children' in item:
            for child in item['children']:
                if 'size_group' in child:
                    size_groups.append(child['size_group'])
    return size_groups
