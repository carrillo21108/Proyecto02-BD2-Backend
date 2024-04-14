# -*- coding: utf-8 -*-
import random
import requests
import dotenv
import os
from neo4j import GraphDatabase

load_status = dotenv.load_dotenv("neo4j.txt")
if load_status is False:
    raise RuntimeError('Environment variables not loaded.')

URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

with GraphDatabase.driver(URI, auth=AUTH) as driver:
    driver.verify_connectivity()



# from pymongo import MongoClient
# from pymongo.errors import BulkWriteError


# mongo_uri = 'mongodb+srv://admin:admin@cluster0.9y482gd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
# db_name = "filmy"
# collection_name = "movies"

# client = MongoClient(mongo_uri)
# db = client[db_name]
# collection = db[collection_name]

def fetch_movies(page):
    url = "https://api.themoviedb.org/3/discover/movie?"
    params = {
        "include_video": "true",
        "page": page,
        "api_key": "2dec075a5d5b7fcfb11d1ba3f2ab9e9d",
        "language": "es",
        "include_image_language": "es,en"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("results", [])
    else:
        return None
# def createMovies():
    

def fetch_movie_credits(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key=2dec075a5d5b7fcfb11d1ba3f2ab9e9d&language=es&include_image_language=es"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None
def createMovie(movie):
    query = '''
    MERGE (n:Movie {id: $id, adult: $adult, original_language:$original_language, overview:$overview, popularity:$popularity, image_paths:$image_paths, release_date:$release_date, title:$title, vote_average:$vote_average, vote_count:$vote_count})
    RETURN n
    '''
    parameters = {
        "id":movie["id"],
        "adult":movie["adult"],
        "original_language":movie["original_language"],
        "overview":movie["overview"],
        "popularity":movie["popularity"],
        "image_paths": [movie["backdrop_path"], movie["poster_path"]],
        "release_date": movie["release_date"],
        "title":movie["title"],
        "vote_average":movie["vote_average"],
        "vote_count":movie["vote_count"]
    }
    with driver.session() as session:
        # Execute the query within a session
        result = session.run(query, parameters)
        # Commit changes and retrieve summary
        summary = result.consume()
        return summary
def createActor(actor, movie_name, date):
    query = '''
    MERGE (n:Actor {id: $id, name: $name, original_name: $original_name, popularity: $popularity})
    ON CREATE SET n.profile_path = CASE WHEN $profile_path IS NULL THEN "" ELSE $profile_path END
    ON MATCH SET n.profile_path = CASE WHEN $profile_path IS NULL THEN "" ELSE $profile_path END
    MERGE (k:Movie {title: $movie_name})
    MERGE (n)-[:ACTED_IN {role: $role, wage: $wage, date: $date}]->(k)
    RETURN n
'''

    parameters = {
        "id":actor.get("id", -1),
        "name":actor.get("name", "None"),
        "original_name":actor.get("original_name", "None"),
        "profile_path":actor.get("profile_path", "None"),
        "popularity":actor.get("popularity",-1000.0),
        "movie_name":movie_name,
        "role":actor.get("character", "None"),
        "wage":random.uniform(10000, 50000000),
        "date":date
    }
    with driver.session() as session:
        # Execute the query within a session
        result = session.run(query, parameters)
        # Commit changes and retrieve summary
        summary = result.consume()
        return summary
def fetch_allMovies():
    movies = fetch_movies(1)
    for movie in movies:
        credits = fetch_movie_credits(movie['id'])
        movie['cast'] = credits.get('cast', [])
        createMovie(movie)
        for actor in movie['cast']:
            createActor(actor, movie["title"], movie["release_date"])
        

    
    # for page in range(0, 100):
        # print(fetch_movies(page))
fetch_allMovies()
# def insert_movies():
#     total_inserted = 0
#     page = 1
#     while total_inserted < 10000:
#         movies = discover_tv_shows(page)
#         if movies:
#             enriched_movies = []
#             for movie in movies:
#                 credits = fetch_movie_credits(movie['id'])
#                 if credits:
#                     movie['cast'] = credits.get('cast', [])
#                     enriched_movies.append(movie)
#             try:
#                 if enriched_movies:
#                     result = collection.insert_many(enriched_movies, ordered=False)
#                     total_inserted += len(result.inserted_ids)
#                     print(f"Inserted {len(result.inserted_ids)} movies with credits. Total inserted: {total_inserted}")
#             except BulkWriteError as bwe:
#                 print("BulkWriteError occurred", bwe.details)
#                 break
#         else:
#             print(f"Failed to fetch movies for page {page}")
#             break
#         page += 1



# def fetch_top_rated_movies(page):
#     url_base = "https://api.themoviedb.org/3/movie/top_rated?"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
    
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "include_video": "true",
#         "page": page,
#         "include_image_language": "es,en"
#     }
    
#     response = requests.get(url_base, params=params)
    
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return None

# def fetch_upcoming_movies(page):
#     url_base = "https://api.themoviedb.org/3/movie/upcoming?"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
    
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "include_video": "true",
#         "page": page,
#         "include_image_language": "es,en"
#     }
    
#     response = requests.get(url_base, params=params)
    
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return none

# def fetch_trending_movies_week(page):
#     url = "https://api.themoviedb.org/3/trending/movie/week"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
    
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "include_video": "true",
#         "page": page,
#         "include_image_language": "es,en"
#     }
    
#     response = requests.get(url, params=params)
    
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return None


# def fetch_now_playing_movies(page=1):
#     url = "https://api.themoviedb.org/3/movie/now_playing"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
#     params = {
#         "api_key": api_key,
#         "language": "es",
#          "include_video": "true",
#          "page": page,
#          "include_image_language": "es,en"
#     }
#     response = requests.get(url, params=params)
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return None


# def discover_tv_shows(sort_by="popularity.desc", page=1, genre=None):
#     url = "https://api.themoviedb.org/3/discover/tv"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "sort_by": sort_by,
#         "page": page,
#         "with_genres": genre
#     }
#     response = requests.get(url, params=params)
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return None


# def discover_sci_fi_movies_from_2020():
#     url = "https://api.themoviedb.org/3/discover/movie"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "sort_by": "vote_average.desc",
#         "year": 2020,
#         "with_genres": "878",
#         "vote_count.gte": 100
#     }
#     response = requests.get(url, params=params)
#     if response.status_code == 200:
#         return response.json().get("results", [])
#     else:
#         return None
    

# def fetch_movie_genres(page=1):
#     url = "https://api.themoviedb.org/3/genre/movie/list"
#     api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
#     params = {
#         "api_key": api_key,
#         "language": "es",
#         "page": page,
#     }
#     response = requests.get(url, params=params)
#     if response.status_code == 200:
#         return response.json().get("genres", [])
#     else:
#         return None

       

# def insert_genres():
#     total_inserted = 0
#     page = 1
#     movies = fetch_movie_genres(page)
#     if movies:
#         try:
#             result = collection.insert_many(movies, ordered=False)
#             total_inserted += len(result.inserted_ids)
#             print(f"Inserted {len(result.inserted_ids)} genres. Total inserted: {total_inserted}")
#         except BulkWriteError as bwe:
#             print("BulkWriteError occurred", bwe.details)
#     else:
#         print(f"Failed to fetch movies for page {page}")
#     page += 1


# insert_movies()

# insert_genres()      
driver.close()  
