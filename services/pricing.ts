import api from "@/utils/api";

export interface PricingRuleLevelBase {
    rule_id: number;
    minimum_quantity: number;
    level_description_key: string;
}

export interface DiscountLevel extends PricingRuleLevelBase {
    discount_value: number;
}

export interface NewPriceLevel extends PricingRuleLevelBase {
    price_per_unit_at_level: number;
}

export type PricingRuleLevel = DiscountLevel | NewPriceLevel;

export interface DiscountRulePayload {
    rule_name_key: string;
    discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
    levels: DiscountLevel[];
}

export interface NewPriceRulePayload {
    rule_name_key: string;
    discount_type: "NEW_PRICE";
    levels: NewPriceLevel[];
}

export type PricingRulePayload = DiscountRulePayload | NewPriceRulePayload;

export interface PricingRuleAssignmentPayload {
    rule_id: number;
    packaging_option_id: number;
    is_active: boolean;
}

export async function createPricingRule(data: PricingRulePayload) {
    const response = await api.post("api/v1/pricing-rules/", data);
    return response;
}

export async function assignPricingRuleToPackagingOption(data: PricingRuleAssignmentPayload) {
    const response = await api.post("api/v1/pricing-rules/assignments/", data);
    return response;
}