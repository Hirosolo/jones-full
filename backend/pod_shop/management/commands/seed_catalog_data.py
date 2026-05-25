from django.core.management.base import BaseCommand

from pod_shop.catalog_defaults import DEFAULT_BRAND_GROUPS
from pod_shop.models import Brand, Category


CATEGORY_SEEDS = [
    'Accessories',
    'Clothing',
    'Footwear',
    'Home Decor',
    'Sale',
]


BRAND_GROUPS = DEFAULT_BRAND_GROUPS


class Command(BaseCommand):
    help = 'Seed catalog categories and grouped brands into the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would change without writing to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        created_categories = 0
        updated_categories = 0
        created_brands = 0
        updated_brands = 0

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\nseed_catalog_data — {'DRY RUN' if dry_run else 'APPLY'}\n"
        ))

        for order, name in enumerate(CATEGORY_SEEDS, start=1):
            category = Category.objects.filter(name__iexact=name).first()
            if category is None:
                created_categories += 1
                if not dry_run:
                    Category.objects.create(name=name, order=order)
                self.stdout.write(self.style.SUCCESS(f'Create category: {name}'))
                continue

            if category.order != order:
                updated_categories += 1
                self.stdout.write(f'Update category order: {name} -> {order}')
                if not dry_run:
                    category.order = order
                    category.save(update_fields=['order'])

        for league_order, (league, brand_names) in enumerate(BRAND_GROUPS.items(), start=1):
            for brand_order, brand_name in enumerate(brand_names, start=1):
                brand = Brand.objects.filter(name__iexact=brand_name).first()
                if brand is None:
                    created_brands += 1
                    self.stdout.write(self.style.SUCCESS(f'Create brand: {league} / {brand_name}'))
                    if not dry_run:
                        Brand.objects.create(
                            name=brand_name,
                            league=league,
                            order=brand_order,
                        )
                    continue

                needs_update = False
                if (brand.league or '').strip() != league:
                    brand.league = league
                    needs_update = True
                if brand.order != brand_order:
                    brand.order = brand_order
                    needs_update = True

                if needs_update:
                    updated_brands += 1
                    self.stdout.write(f'Update brand: {league} / {brand_name}')
                    if not dry_run:
                        brand.save(update_fields=['league', 'order'])

        self.stdout.write(self.style.SUCCESS(
            f'\nSummary: categories created={created_categories}, updated={updated_categories}; '
            f'brands created={created_brands}, updated={updated_brands}\n'
        ))

        if dry_run:
            self.stdout.write(self.style.NOTICE('Dry-run only. Re-run without --dry-run to persist changes.'))