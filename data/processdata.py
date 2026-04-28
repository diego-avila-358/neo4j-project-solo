#Import for reading tsv
import pandas as pd
# Super big file, adding in loader
from tqdm import tqdm

# read in x file in chunks and show loading
def read_tsv_in_chunks(file_path, chunk_size=100000):
    chunks = []
    for chunk in tqdm(pd.read_csv(file_path, sep='\t', chunksize=chunk_size, low_memory=False)):
        #file uses \N for missing values
        chunk = chunk.replace('\\N', pd.NA)
        chunks.append(chunk)
    return pd.concat(chunks, ignore_index=True)

# read in title.basics.tsv and title.ratings.tsv by chunks
print("processing title.basics.tsv...")
title_basics = read_tsv_in_chunks('data/raw/title.basics.tsv', chunk_size=100000)

# make title.csv
title = title_basics[['tconst', 
                      'primaryTitle', 
                      'originalTitle', 
                      'isAdult', 
                      'startYear', 
                      'endYear', 
                      'runtimeMinutes']].copy()

print("processing title.ratings.tsv...")
title_ratings = read_tsv_in_chunks('data/raw/title.ratings.tsv', chunk_size=100000)

#add ratings to title
title = title.merge(title_ratings, on='tconst', how='left')

# make genres.csv (list of genres) 
genres = title_basics[['genres']].copy()

# split genres into separate rows
genres = genres['genres'].str.split(',', expand=True).stack().reset_index(level=1, drop=True).to_frame('genre').dropna().drop_duplicates()

# title_genres.csv
title_genres = title_basics[['tconst', 'genres']].copy().dropna(subset=['genres'])
title_genres = title_genres.assign(genre=title_genres['genres']
                                   .str.split(',')).explode('genre')[['tconst', 'genre']]

# Creating people nodes

# Read in name.basics.tsv 
print("processing name.basics.tsv...")
name_basics = read_tsv_in_chunks('data/raw/name.basics.tsv', chunk_size=100000)

people = name_basics[['nconst', 'primaryName', 'birthYear', 'deathYear']].copy()

# Create title_principals.csv
print("processing title.principals.tsv...")
title_principals = read_tsv_in_chunks('data/raw/title.principals.tsv', chunk_size=100000)
title_principals = title_principals[title_principals['category'].isin(['actor', 'actress', 'director', 'writer'])]

acted_in = title_principals[title_principals['category'].isin(['actor', 'actress'])][['nconst', 'tconst']]

directed = title_principals[title_principals['category'] == 'director'][['nconst', 'tconst']]

wrote = title_principals[title_principals['category'] == 'writer'][['nconst', 'tconst']]

# Save processed data to csv
title.to_csv('data/processed/title.csv', index=False)
people.to_csv('data/processed/people.csv', index=False)

genres.to_csv('data/processed/genres.csv', index=False)
title_genres.to_csv('data/processed/title_genres.csv', index=False)

acted_in.to_csv('data/processed/acted_in.csv', index=False)
directed.to_csv('data/processed/directed.csv', index=False)
wrote.to_csv('data/processed/wrote.csv', index=False)

