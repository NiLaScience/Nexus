from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain_community.document_loaders.pdf import PyMuPDFLoader
from langchain.prompts.prompt import PromptTemplate
from langchain.schema import Document
from dotenv import load_dotenv
import os

load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
os.environ["PINECONE_API_KEY"] = os.getenv("PINECONE_API_KEY")
os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = os.getenv("LANGCHAIN_TRACING_V2")
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT")
PINECONE_SUMMARY_INDEX = os.getenv("PINECONE_SUMMARY_INDEX")

llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.0)
embeddings = OpenAIEmbeddings()

input_dir = "./docs"
pdf_files = [f for f in os.listdir(input_dir) if f.endswith(".pdf")]

for pdf_file in pdf_files:
    pdf_path = os.path.join(input_dir, pdf_file)
    print(pdf_file)

    loader = PyMuPDFLoader(pdf_path)
    raw_docs = loader.load()
    all_text = "\n\n".join([doc.page_content for doc in raw_docs])

    prompt = "Summarize this book's text for use with retrieval-augmented generation summary lookup"
    template = PromptTemplate(template="{prompt} Book: {book}", input_variables=["prompt", "book"])
    prompt_with_book = template.invoke({"prompt": prompt, "book": all_text})
    summary = llm.invoke(prompt_with_book)

    source = f"docs/{pdf_file}"
    summary_doc = [Document(page_content=summary.content, metadata={"source": source})]

    PineconeVectorStore.from_documents(
        documents=summary_doc,
        embedding=embeddings,
        index_name=PINECONE_SUMMARY_INDEX
    )

print("All summaries processed")
