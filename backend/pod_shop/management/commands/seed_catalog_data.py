from django.core.management.base import BaseCommand

from pod_shop.models import Brand, Category


CATEGORY_SEEDS = [
    'Accessories',
    'Clothing',
    'Footwear',
    'Home Decor',
    'Sale',
]


BRAND_GROUPS = {
    'Business': [
        'Budweiser', 'Chevrolet', 'Coca-Cola', 'Ducati', 'Grey Goose', 'Guinness',
        'Harley-Davidson', 'Indian Motorcycle', "Jack Daniel's", 'Jeep', 'Marlboro',
        'Monster Energy', 'Starbucks', 'The Famous Grouse', 'The Kraken',
    ],
    'Culture': [
        'Alpha Kappa Alpha', 'America', 'Bob Kevoian', 'Calvin and Hobbes', 'Captain Morgan',
        "Father's Day", 'Independence Hall', "Mother's Day", 'Peanuts', 'Route 66',
        'Royal Navy', 'Smokey Bear', 'US Marine Corps', 'US Navy', 'USA', 'Veteran Day',
    ],
    'K-Pop': ['Aespa', 'BTS', 'G-Dragon'],
    'Movie': [
        'Avatar', 'Batman', 'Dragon Ball', 'Godzilla', 'Harry Potter', 'James Bond 007',
        'Marty Supreme', 'Naruto', 'One Piece', 'Peanut', 'Pokémon', 'Scream', 'Star Trek',
        'Star Wars', 'Stranger Things', 'The Lord of the Rings', 'The Muppet Show',
        'The Simpsons', 'Top Gun', 'Winnie the Pooh', 'Zootopia',
    ],
    'Music': [
        'Bruce Springsteen', 'Clint Black', 'Dolly Parton', 'Elvis Presley', 'Freddie Mercury',
        'Jimmy Buffett', 'Kenny Chesney', 'Michael Jackson', 'Prince', 'Rock the Country',
        'Westlife', 'Willie Nelson',
    ],
    'Other': [
        'Animals', 'Bad Omens', 'Charlie Puth', 'Chris Brown', 'DC', 'DMX', 'Doctor Who',
        'Five Finger Death Punch', 'Foo Fighters', 'Friday The 13th', 'G.I. Joe',
        'Game of Thrones', 'Gundam', 'House of the Dragon', 'Jujutsu Kaisen', 'Justin Bieber',
        'La La Land', 'Magic The Gathering', 'Marvel', 'Mission Impossible',
        'My Hero Academia', 'Noah Kahan', 'Pepe Aguilar', 'Phil Campbell',
        'Pirates of the Caribbean', 'Predator', 'Rat Fink', 'Slash', 'Snoop Dogg',
        'Taxi Driver', 'The Texas Chainsaw Massacre',
    ],
    'Rock Band': [
        'AC/DC', 'Aerosmith', 'Black Stone Cherry', "Guns N' Roses", 'Iron Maiden', 'KISS',
        'Led Zeppelin', 'Megadeth', 'Metallica', 'Pink Floyd', 'Queen', 'RUSH', 'Sleep Token',
        'The Beatles', 'The Eagles', 'The Rolling Stones', 'Thirty Seconds to Mars',
        'Van Halen', 'Wu-Tang Clan',
    ],
    'Sport': ['MLB', 'NBA', 'NCAA', 'NFL', 'NHL', 'Other Sport', 'Soccer'],
    'Tabletop': ['Dungeons & Dragons'],
    'Video Game': ['Fallout', 'Sonic The Hedgehog', 'World of Warcraft', 'Zelda'],
}


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