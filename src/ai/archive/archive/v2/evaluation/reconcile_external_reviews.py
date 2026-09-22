import json
import os

def main():
    print("V2 Pilot Review Reconciliation Script")
    print("This script is designed to aggregate results from external_review_result_template.json files submitted by Gemini, Claude, and Human reviewers.")
    print("It classifies each question into CONSENSUS_KEEP, CONSENSUS_REVISE, CONSENSUS_REJECT, or DISAGREEMENT_REQUIRES_HUMAN.\n")
    
    # Normally this would load from a submissions folder.
    # We will simulate the logic structure here.
    
    # Example structure:
    # reviews = { "annot_123": { "GEMINI": "KEEP", "CLAUDE": "REVISE", "HUMAN": "KEEP" } }
    
    def reconcile(decisions):
        """
        decisions: dict of reviewer -> decision (e.g. {'GEMINI': 'KEEP', 'CLAUDE': 'KEEP'})
        """
        vals = list(decisions.values())
        if not vals:
            return "PENDING_REVIEWS"
            
        # If all agree
        if all(v == "KEEP" for v in vals) and len(vals) == 3:
            return "CONSENSUS_KEEP"
        if all(v == "REVISE" for v in vals) and len(vals) == 3:
            return "CONSENSUS_REVISE"
        if all(v == "REJECT" for v in vals) and len(vals) == 3:
            return "CONSENSUS_REJECT"
            
        # If there is disagreement, or missing reviews, flag for human
        # (The instructions explicitly state: Do not automatically override disagreement.)
        return "DISAGREEMENT_REQUIRES_HUMAN"

    print("Reconciliation logic initialized. Ready to process external submissions.")

if __name__ == "__main__":
    main()
