# -*- coding: utf-8 -*-
import random
import requests
import dotenv
import os
from neo4j import GraphDatabase
import datetime

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

def getRandomDate():
    start_dt = datetime.date.today().replace(day=1, month=1).toordinal()
    end_dt = datetime.date.today().toordinal()
    return datetime.date.fromordinal(random.randint(start_dt, end_dt))
    
def fetch_movie_genres(page=1):
    url = "https://api.themoviedb.org/3/genre/movie/list"
    api_key = "2dec075a5d5b7fcfb11d1ba3f2ab9e9d"
    params = {
        "api_key": api_key,
        "language": "es",
        "page": page,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("genres", [])
    else:
        return None

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
    
def fetch_movies_(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key=2dec075a5d5b7fcfb11d1ba3f2ab9e9d&language=es&include_image_language=es"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None
    

def fetch_movie_credits(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key=2dec075a5d5b7fcfb11d1ba3f2ab9e9d&language=es&include_image_language=es"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None
    
def createSex():
    query = '''
    MERGE (n:Genre {id:0,name:"Not set / not specified", popularity:0, description:"People who prefer not to say gender or is not set the gender", character:'N'})
    MERGE (k:Genre {id:1,name:"Female", popularity:0, description:"An organism's sex is female.", character:'F'})
    MERGE (l:Genre {id:2,name:"Male", popularity:0, description:"An organism's sex is male.", character:'M'})
    MERGE (m:Genre {id:3,name:"Non Binary", popularity:0, description:"Non-binary[a] and genderqueer are umbrella terms for gender identities that are not solely male or female (identities outside the gender binary).[2][3] Non-binary identities often fall under the transgender umbrella since non-binary people typically identify with a gender that is different from the sex assigned to them at birth,[3] though some non-binary people do not consider themselves transgender.[4][5]", character:'B'})
    RETURN n
    '''
    with driver.session() as session:
        # Execute the query within a session
        result = session.run(query)
        # Commit changes and retrieve summary
        summary = result.consume()
        return summary
    
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
    
def createDirector(crew, movie_name, budget, date):
    for crew_member in crew:
        if (crew_member["job"]=="Director"):
            query = '''
            MERGE (n:Director {id: $id, name: $name, popularity: $popularity})
            ON CREATE SET n.profile_path = CASE WHEN $profile_path IS NULL THEN "" ELSE $profile_path END
            ON MATCH SET n.profile_path = CASE WHEN $profile_path IS NULL THEN "" ELSE $profile_path END
            MERGE (k:Movie {title: $movie_name})
            MERGE (n)-[:DIRECTED_IN {budget: $budget, wage: $wage, date: $date}]->(k)
            MERGE (m:Genre {id: $gender})
            MERGE (n)-[:IS {birth:$birth, place:$place, last_update:$last_update}]->(m)
            RETURN n
            '''
            parameters = {
                "id":crew_member.get("id", -1),
                "name":crew_member.get("name", "None"),
                "profile_path":crew_member.get("profile_path", "None"),
                "popularity":crew_member.get("popularity",-1000.0),
                "movie_name":movie_name,
                "budget":budget,
                "wage":random.uniform(10000, 50000000),
                "date":date,
                "place":crew_member.get("known_for_department","None"),
                "last_update": datetime.date.today(),
                "birth":getRandomDate(),
                "gender":crew_member.get("gender", "None")
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
    MERGE (m:Genre {id: $gender})
    MERGE (n)-[:IS {birth:$birth, place:$place, last_update:$last_update}]->(m)
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
        "date":date,
        "place":actor.get("known_for_department","None"),
        "last_update": datetime.date.today(),
        "birth":getRandomDate(),
        "gender":actor.get("gender", "None")
    }
    with driver.session() as session:
        # Execute the query within a session
        result = session.run(query, parameters)
        # Commit changes and retrieve summary
        summary = result.consume()
        return summary
def fetch_allMovies():
    movies = fetch_movies(1)
    movies_ = None
    for movie in movies:
        movie_name = movie["title"]
        date = movie["release_date"]
        credits = fetch_movie_credits(movie['id'])
        movies_ = fetch_movies_(movie['id'])
        movie['cast'] = credits.get('cast', [])
        createMovie(movie)
        createDirector(credits.get('crew', []),movie_name,movies_["budget"],date)
        for actor in movie['cast']:
            createActor(actor, movie_name, date)
            
createSex()
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
