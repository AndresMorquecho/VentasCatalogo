import { create } from 'zustand';

interface LoyaltyUIState {
    prizeModalOpen: boolean;
    setPrizeModalOpen: (open: boolean) => void;
    ruleModalOpen: boolean;
    setRuleModalOpen: (open: boolean) => void;
}

export const useLoyaltyStore = create<LoyaltyUIState>((set) => ({
    prizeModalOpen: false,
    setPrizeModalOpen: (open) => set({ prizeModalOpen: open }),
    ruleModalOpen: false,
    setRuleModalOpen: (open) => set({ ruleModalOpen: open }),
}));
