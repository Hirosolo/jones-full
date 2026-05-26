from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('utils', '0004_alter_staticpage_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='homeslider',
            name='type',
            field=models.CharField(blank=True, help_text='Text hiển thị phía sau tiêu đề slider', max_length=100),
        ),
    ]