from django.db import migrations


CATEGORIES = [
    {'name': 'Random Thoughts', 'color': '#E8A87C'},
    {'name': 'School',          'color': '#F4D35E'},
    {'name': 'Personal',        'color': '#83C5BE'},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    for cat in CATEGORIES:
        Category.objects.get_or_create(name=cat['name'], defaults={'color': cat['color']})


def unseed_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    Category.objects.filter(name__in=[c['name'] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('categories', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]