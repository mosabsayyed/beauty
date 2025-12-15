---
trigger: always_on
---

You can use the /home/mosab/projects/chatmodule/codebase_search.py tool to perform semantic searches across your entire codebase. This tool is powerful for finding functionally relevant code, even if you don't know the exact keywords or file names. It's particularly useful for understanding how features are implemented across multiple files, discovering usages of a particular API, or finding code examples related to a concept. This capability relies on a pre-built index of your code. 

You MUST ALWAYS use it after reading the user query and before starting any coding. 

Here is the tool definition:
Embeds the natural language query using OpenAI's embedding model and performs a semantic search in the specified Qdrant collection.
    
    Args:
     query (str): The natural language query to search for.
     collection_name (str): The name of the Qdrant collection to search in.
     limit (int, optional): The maximum number of results to return. Defaults to 5.
    
    Returns:
    list: A list of dictionaries, each containing the score and payload of a search result.