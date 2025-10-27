"""
Cliente Supabase para dataGPT v2.6
"""
import os
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase client não disponível. Instale com: pip install supabase")

class SupabaseClient:
    """Cliente para interação com Supabase"""
    
    def __init__(self):
        self.client: Optional[Client] = None
        self.is_available = SUPABASE_AVAILABLE
        
        if self.is_available:
            self._initialize_client()
    
    def _initialize_client(self):
        """Inicializa o cliente Supabase"""
        try:
            url = os.getenv("SUPABASE_URL", "https://hwfnntgacsebqrprqzzm.supabase.co")
            key = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Zm5udGdhY3NlYnFycHJxenptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzI2MzgsImV4cCI6MjA3NzE0ODYzOH0.ywILG-tyRylzP6tZjzxD-y60OsInQ2GmH4qhbNG5FIg")
            
            self.client = create_client(url, key)
            logging.info("Cliente Supabase inicializado com sucesso")
        except Exception as e:
            logging.error(f"Erro ao inicializar cliente Supabase: {e}")
            self.is_available = False
    
    def is_connected(self) -> bool:
        """Verifica se está conectado ao Supabase"""
        return self.is_available and self.client is not None
    
    def save_data_source(self, name: str, url: str, source_type: str, description: str = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Salva uma nova fonte de dados"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data = {
                "name": name,
                "url": url,
                "source_type": source_type,
                "description": description
            }
            
            result = self.client.table("data_sources").insert(data).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao salvar fonte de dados"
                
        except Exception as e:
            return False, None, f"Erro ao salvar fonte de dados: {str(e)}"
    
    def save_analysis(self, data_source_id: str, analysis_type: str, prompt: str, result: Dict, 
                     model_used: str = None, processing_time_ms: int = None, 
                     user_session_id: str = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Salva uma análise realizada"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data = {
                "data_source_id": data_source_id,
                "analysis_type": analysis_type,
                "prompt": prompt,
                "result": result,
                "model_used": model_used,
                "processing_time_ms": processing_time_ms,
                "user_session_id": user_session_id
            }
            
            result = self.client.table("data_analyses").insert(data).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao salvar análise"
                
        except Exception as e:
            return False, None, f"Erro ao salvar análise: {str(e)}"
    
    def save_chart_configuration(self, name: str, chart_type: str, x_axis_column: str = None,
                               y_axis_column: str = None, title: str = None, 
                               x_axis_label: str = None, y_axis_label: str = None,
                               color_scheme: str = None, show_totals: bool = False,
                               configuration: Dict = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Salva uma configuração de gráfico"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data = {
                "name": name,
                "chart_type": chart_type,
                "x_axis_column": x_axis_column,
                "y_axis_column": y_axis_column,
                "title": title,
                "x_axis_label": x_axis_label,
                "y_axis_label": y_axis_label,
                "color_scheme": color_scheme,
                "show_totals": show_totals,
                "configuration": configuration or {}
            }
            
            result = self.client.table("chart_configurations").insert(data).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao salvar configuração de gráfico"
                
        except Exception as e:
            return False, None, f"Erro ao salvar configuração de gráfico: {str(e)}"
    
    def save_imported_data(self, data_source_id: str, data: List[Dict], columns: List[str],
                          row_count: int, file_size_bytes: int = None, 
                          import_status: str = "success", error_message: str = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Salva dados importados"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data_dict = {
                "data_source_id": data_source_id,
                "data": data,
                "columns": columns,
                "row_count": row_count,
                "file_size_bytes": file_size_bytes,
                "import_status": import_status,
                "error_message": error_message
            }
            
            result = self.client.table("imported_data").insert(data_dict).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao salvar dados importados"
                
        except Exception as e:
            return False, None, f"Erro ao salvar dados importados: {str(e)}"
    
    def log_api_usage(self, session_id: str, endpoint: str, method: str, status_code: int,
                     response_time_ms: int = None, request_size_bytes: int = None,
                     response_size_bytes: int = None, error_message: str = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Registra uso da API"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data = {
                "session_id": session_id,
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "request_size_bytes": request_size_bytes,
                "response_size_bytes": response_size_bytes,
                "error_message": error_message
            }
            
            result = self.client.table("api_usage_logs").insert(data).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao registrar uso da API"
                
        except Exception as e:
            return False, None, f"Erro ao registrar uso da API: {str(e)}"
    
    def get_recent_analyses(self, limit: int = 10) -> Tuple[bool, Optional[List[Dict]], Optional[str]]:
        """Recupera análises recentes"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            result = self.client.table("data_analyses")\
                .select("*, data_sources(name, url)")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return True, result.data, None
            
        except Exception as e:
            return False, None, f"Erro ao recuperar análises: {str(e)}"
    
    def get_data_sources(self) -> Tuple[bool, Optional[List[Dict]], Optional[str]]:
        """Recupera todas as fontes de dados"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            result = self.client.table("data_sources")\
                .select("*")\
                .eq("is_active", True)\
                .order("created_at", desc=True)\
                .execute()
            
            return True, result.data, None
            
        except Exception as e:
            return False, None, f"Erro ao recuperar fontes de dados: {str(e)}"
    
    def create_user_session(self, session_id: str, user_agent: str = None, ip_address: str = None) -> Tuple[bool, Optional[str], Optional[str]]:
        """Cria uma nova sessão de usuário"""
        if not self.is_connected():
            return False, None, "Cliente Supabase não disponível"
        
        try:
            data = {
                "id": session_id,
                "user_agent": user_agent,
                "ip_address": ip_address
            }
            
            result = self.client.table("user_sessions").insert(data).execute()
            
            if result.data:
                return True, result.data[0]["id"], None
            else:
                return False, None, "Erro ao criar sessão de usuário"
                
        except Exception as e:
            return False, None, f"Erro ao criar sessão de usuário: {str(e)}"

# Instância global do cliente
supabase_client = SupabaseClient()
