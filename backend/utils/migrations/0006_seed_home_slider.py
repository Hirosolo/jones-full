from django.db import migrations


def seed_home_slider(apps, schema_editor):
    HomeSlider = apps.get_model('utils', 'HomeSlider')

    if HomeSlider.objects.exists():
        return

    HomeSlider.objects.bulk_create([
        HomeSlider(
            type='signature',
            title='Discover. Design. Define Your Style',
            desc='Premium trending products with worldwide shipping',
            desc_safe='Premium trending products with worldwide shipping',
            image='/img/hero-slide-1.png',
            link='/c/',
            button_text='SHOP NOW',
            order=1,
            status=True,
        ),
        HomeSlider(
            type='modern',
            title='New Arrivals',
            desc='Explore the latest collection of fashion, accessories & home decor',
            desc_safe='Explore the latest collection of fashion, accessories & home decor',
            image='/img/hero-slide-2.png',
            link='/c/',
            button_text='EXPLORE',
            order=2,
            status=True,
        ),
        HomeSlider(
            type='classic',
            title='Premium Quality',
            desc='Custom-designed products made just for you',
            desc_safe='Custom-designed products made just for you',
            image='/img/hero-slide-3.png',
            link='/c/',
            button_text='DISCOVER',
            order=3,
            status=True,
        ),
    ])


def unseed_home_slider(apps, schema_editor):
    HomeSlider = apps.get_model('utils', 'HomeSlider')
    HomeSlider.objects.filter(title__in=[
        'Discover. Design. Define Your Style',
        'New Arrivals',
        'Premium Quality',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('utils', '0005_homeslider_type'),
    ]

    operations = [
        migrations.RunPython(seed_home_slider, unseed_home_slider),
    ]