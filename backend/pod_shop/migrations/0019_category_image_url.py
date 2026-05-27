from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pod_shop', '0018_seed_footer_cms'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='image_url',
            field=models.URLField(blank=True, max_length=1000),
        ),
    ]