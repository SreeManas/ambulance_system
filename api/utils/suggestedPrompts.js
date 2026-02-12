/**
 * suggestedPrompts.js — Role-Based Suggested Questions Engine
 * Extracted from server/suggestedPrompts.js for Vercel serverless use
 */

const ROLE_PROMPTS = {
    paramedic: {
        default: [
            "Which hospital is best for my current patient?",
            "What's the golden hour status?",
            "Are there ventilators available nearby?",
            "Explain the hospital ranking for this case",
            "What pre-hospital interventions should I consider?",
            "Is the recommended hospital on diversion?"
        ],
        withCase: [
            "Why was this hospital ranked #1?",
            "What's the ETA to the top hospital?",
            "Does the hospital have the right specialists?",
            "Are there ICU beds available?",
            "Should I consider an alternative hospital?",
            "What equipment does the top hospital have?"
        ]
    },

    dispatcher: {
        default: [
            "Show me current fleet utilization",
            "Are there any overloaded zones?",
            "Which hospitals are near capacity?",
            "Any diversion alerts active?",
            "Recommend ambulance for next incoming case",
            "What's the average response time today?"
        ],
        withCase: [
            "Which ambulance should I assign to this case?",
            "Are there any fleet conflicts?",
            "What hospitals can accept this case type?",
            "Is there a closer available unit?"
        ]
    },

    hospital_admin: {
        default: [
            "What's our current bed availability?",
            "Any incoming emergency cases?",
            "Summarize our specialist availability",
            "What's our hospital capability score?",
            "Are we at risk of capacity overload?",
            "Show equipment status"
        ],
        withHospital: [
            "How is our score calculated?",
            "What can we improve in our ranking?",
            "How many cases are routed to us today?",
            "What's our current ICU utilization?"
        ]
    },

    command_center: {
        default: [
            "Give me a system-wide status summary",
            "Any golden hour violations today?",
            "Which hospitals have the most capacity?",
            "Show fleet distribution overview",
            "Are there any network bottlenecks?",
            "What's the current case load across the system?"
        ]
    },

    admin: {
        default: [
            "Show system-wide analytics",
            "How is the scoring engine configured?",
            "What's the overall platform health?",
            "Show hospital network coverage",
            "Any data quality issues detected?",
            "Explain the routing algorithm weights"
        ]
    }
};

export function getSuggestedPrompts(role, context = {}) {
    const roleConfig = ROLE_PROMPTS[role] || ROLE_PROMPTS.paramedic;

    // Pick context-aware prompts if available
    if (context.caseId && roleConfig.withCase) {
        return roleConfig.withCase;
    }
    if (context.hospitalId && roleConfig.withHospital) {
        return roleConfig.withHospital;
    }

    return roleConfig.default;
}
