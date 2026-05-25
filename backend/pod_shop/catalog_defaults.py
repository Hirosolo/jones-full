DEFAULT_BRAND_GROUPS = {
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


def ensure_default_brands():
    from pod_shop.models import Brand

    created = False
    for league, brand_names in DEFAULT_BRAND_GROUPS.items():
        for brand_order, brand_name in enumerate(brand_names, start=1):
            brand = Brand.objects.filter(name__iexact=brand_name).first()
            if brand is not None:
                continue

            Brand.objects.create(
                name=brand_name,
                league=league,
                order=brand_order,
            )
            created = True

    return created