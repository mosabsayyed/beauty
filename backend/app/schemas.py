from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field, validator

class ChartConfig(BaseModel):
    xAxis: Optional[str] = None
    yAxis: Optional[str] = None
    sizeMetric: Optional[str] = None
    html_content: Optional[str] = None # For HTML artifacts that might misuse config

class Visualization(BaseModel):
    type: Literal["column", "line", "radar", "bubble", "bullet", "combo", "table", "html"]
    title: str = "Untitled"
    config: Optional[Union[ChartConfig, Dict[str, Any]]] = Field(default_factory=dict)
    data: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    content: Optional[Union[str, Dict[str, Any]]] = None # For HTML content

    @validator('config', pre=True)
    def ensure_config_dict(cls, v):
        if v is None:
            return {}
        return v

class MemoryProcess(BaseModel):
    intent: Optional[str] = None
    thought_trace: Optional[str] = None

class DataPayload(BaseModel):
    query_results: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    summary_stats: Optional[Dict[str, Any]] = Field(default_factory=dict)

class LLMResponse(BaseModel):
    answer: Union[str, Any] = ""
    memory_process: Optional[MemoryProcess] = Field(default_factory=MemoryProcess)
    analysis: Optional[List[str]] = Field(default_factory=list)
    visualizations: Optional[List[Visualization]] = Field(default_factory=list)
    data: Optional[DataPayload] = Field(default_factory=DataPayload)
    cypher_executed: Optional[str] = None
    confidence: Optional[float] = 0.0
    tool_results: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
