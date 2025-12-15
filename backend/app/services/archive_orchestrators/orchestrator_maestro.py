"""
Maestro Orchestrator - Executive Persona

This is an alias/wrapper for the unified NoorOrchestrator with persona='maestro'.
The orchestrator_noor.py module supports both Noor and Maestro personas.

Maestro-specific features:
- Access to 'secrets' memory scope (in addition to personal/departmental/ministry)
- Uses port 8202 MCP router
- Executive-level privileges
"""

from app.services.orchestrator_noor import NoorOrchestrator as UnifiedOrchestrator


class MaestroOrchestrator(UnifiedOrchestrator):
    """
    Maestro Orchestrator for Executive Users
    
    Inherits all functionality from the unified orchestrator,
    initialized with persona='maestro' for executive-level access.
    """
    
    def __init__(self):
        """Initialize orchestrator with Maestro persona"""
        super().__init__(persona="maestro")
