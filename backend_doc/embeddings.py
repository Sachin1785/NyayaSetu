from langchain_huggingface import HuggingFaceEmbeddings
from numpy import dot
from numpy.linalg import norm
import time

def get_embedding_function():
    # start = time.time()
    embedding_fucntion = HuggingFaceEmbeddings(model_name="./embedding_model")
    # end = time.time()
    # vector1 = embedding_fucntion.embed_query("I love machine learning")
    # vector2 = embedding_fucntion.embed_query("I love machine learning")
    # # print(vector1)
    # # print(vector2)
    # res = dot(vector1, vector2) / (norm(vector1) * norm(vector2))
    # print(res)
    # print(f"loaded, time {end-start}")
    return embedding_fucntion


if __name__ == '__main__':
    print("Hello worled")
    # embedding_fucntion = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    # k = get_embedding_function()