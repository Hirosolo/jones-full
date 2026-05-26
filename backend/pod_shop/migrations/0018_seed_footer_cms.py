from django.db import migrations


def seed_footer_cms(apps, schema_editor):
    CMSContent = apps.get_model('pod_shop', 'CMSContent')
    obj, _ = CMSContent.objects.get_or_create(pk=1)

    payload = obj.payload if isinstance(obj.payload, dict) else {}
    footer = payload.get('footer') if isinstance(payload.get('footer'), dict) else {}
    has_new_shape = all(
        key in footer for key in ('contact', 'aboutLinks', 'quickLinks', 'newsletter', 'socialLinks', 'gutter')
    )

    if not has_new_shape:
        footer = {
            'title': 'Jones',
            'description': 'Premium sneaker culture, styled for the Jones community.',
            'copyright': 'Jones LLC. All Rights Reserved',
            'contact': {
                'address': '46 Lakeshore St. Knoxville, TN 37918',
                'phone': '+1 (312) 478 6691',
                'email': 'support@jones.com',
                'hours': '10:00 - 18:00, Mon - Sat',
            },
            'aboutLinks': [
                {'label': 'About Us', 'link': '/about', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'Delivery Information', 'link': '/delivery-info', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'Contact Us', 'link': '/contact', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'Returns', 'link': '/returns', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'F.A.Q', 'link': '/faq', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'Site Map', 'link': '/sitemap.xml', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
            ],
            'quickLinks': [
                {'label': 'Sign In', 'link': '/signin', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'View Cart', 'link': '/', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                {'label': 'Track My Order', 'link': '/track-order', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
            ],
            'newsletter': {
                'title': 'newsletter',
                'description': "Sign up to our newsletter and we'll keep you up-to-date with the latest arrivals and special offers.",
                'disclaimer': 'By signing up you are confirming that you have read, understood and accept our Privacy Policy.',
            },
            'socialLinks': [
                {'platform': 'facebook', 'url': 'https://www.facebook.com/jonesstore/', 'visible': True},
                {'platform': 'instagram', 'url': 'https://www.instagram.com/jonesstore/', 'visible': True},
                {'platform': 'youtube', 'url': 'https://www.youtube.com/c/jonesstore', 'visible': True},
                {'platform': 'twitter', 'url': 'https://twitter.com/jonesstore', 'visible': True},
                {'platform': 'pinterest', 'url': 'https://www.pinterest.com/jonesstore/', 'visible': True},
                {'platform': 'github', 'url': 'https://github.com/VektorTech/jones-store', 'visible': True},
            ],
            'gutter': {
                'termsLinks': [
                    {'label': 'Terms', 'link': '/terms', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                    {'label': 'Privacy', 'link': '/privacy', 'target': '_self', 'rel': 'noopener noreferrer', 'visible': True},
                ],
                'copy': 'Jones LLC. All Rights Reserved',
                'languageLabel': 'English',
                'currencyLabelPrefix': '$',
            },
        }

    payload['footer'] = footer
    obj.payload = payload
    obj.save(update_fields=['payload', 'updated_at'])


class Migration(migrations.Migration):
    dependencies = [
        ('pod_shop', '0017_productslugalias'),
    ]

    operations = [
        migrations.RunPython(seed_footer_cms, migrations.RunPython.noop),
    ]
