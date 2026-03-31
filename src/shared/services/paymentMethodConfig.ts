/**
 * Payment Method Configuration Service
 *
 * Provides dynamic loading, validation, and management of available payment methods.
 * Supports enabling/disabling payment methods without code changes (Requirement 8.3).
 */

export type PaymentMethodKey = 'EFECTIVO' | 'BILLETERA_VIRTUAL' | 'TRANSFERENCIA' | 'DEPOSITO' | 'CHEQUE';

export interface PaymentMethodConfig {
  /** Internal key used in API payloads */
  key: PaymentMethodKey;
  /** Human-readable label shown in the UI */
  label: string;
  /** Whether this method is currently available */
  enabled: boolean;
  /** Whether a bank account selection is required */
  requiresBankAccount: boolean;
  /** Whether a transaction reference is required */
  requiresReference: boolean;
  /** Whether this method uses the client wallet balance */
  isWallet: boolean;
  /** Display order in the UI */
  order: number;
}

export interface PaymentMethodConfigurationResult {
  methods: PaymentMethodConfig[];
  isValid: boolean;
  error?: string;
}

/**
 * Default configuration for all supported payment methods.
 * This acts as the base configuration that can be overridden at runtime.
 */
const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    key: 'EFECTIVO',
    label: 'Efectivo',
    enabled: true,
    requiresBankAccount: true,
    requiresReference: false,
    isWallet: false,
    order: 1,
  },
  {
    key: 'BILLETERA_VIRTUAL',
    label: 'Billetera Virtual',
    enabled: true,
    requiresBankAccount: false,
    requiresReference: false,
    isWallet: true,
    order: 2,
  },
  {
    key: 'TRANSFERENCIA',
    label: 'Transferencia',
    enabled: false,
    requiresBankAccount: true,
    requiresReference: true,
    isWallet: false,
    order: 3,
  },
  {
    key: 'DEPOSITO',
    label: 'Depósito',
    enabled: true,
    requiresBankAccount: true,
    requiresReference: true,
    isWallet: false,
    order: 4,
  },
  {
    key: 'CHEQUE',
    label: 'Cheque',
    enabled: true,
    requiresBankAccount: true,
    requiresReference: true,
    isWallet: false,
    order: 5,
  },
];

/**
 * Validates a payment method configuration array.
 * Ensures at least one method is enabled (Requirement 8.4).
 */
export function validatePaymentMethodConfig(
  methods: PaymentMethodConfig[]
): PaymentMethodConfigurationResult {
  if (!methods || methods.length === 0) {
    return {
      methods: [],
      isValid: false,
      error: 'No payment methods configured',
    };
  }

  const enabledMethods = methods.filter((m) => m.enabled);

  if (enabledMethods.length === 0) {
    return {
      methods,
      isValid: false,
      error: 'At least one payment method must be enabled',
    };
  }

  return { methods, isValid: true };
}

/**
 * Merges a partial override configuration with the defaults.
 * Allows enabling/disabling specific methods without replacing the full config.
 */
export function mergePaymentMethodConfig(
  overrides: Partial<Record<PaymentMethodKey, Partial<PaymentMethodConfig>>>
): PaymentMethodConfig[] {
  return DEFAULT_PAYMENT_METHODS.map((method) => {
    const override = overrides[method.key];
    if (!override) return method;
    return { ...method, ...override };
  });
}

/**
 * PaymentMethodConfigService
 *
 * Singleton service that manages the active payment method configuration.
 * Supports dynamic loading and runtime updates (Requirements 8.1, 8.3).
 */
export class PaymentMethodConfigService {
  private static instance: PaymentMethodConfigService;
  private config: PaymentMethodConfig[];

  private constructor(initialConfig?: PaymentMethodConfig[]) {
    this.config = initialConfig ?? [...DEFAULT_PAYMENT_METHODS];
  }

  static getInstance(): PaymentMethodConfigService {
    if (!PaymentMethodConfigService.instance) {
      PaymentMethodConfigService.instance = new PaymentMethodConfigService();
    }
    return PaymentMethodConfigService.instance;
  }

  /**
   * Returns all configured payment methods (enabled and disabled).
   */
  getAllMethods(): PaymentMethodConfig[] {
    return [...this.config];
  }

  /**
   * Returns only the enabled payment methods, sorted by display order.
   * Used by the UI to determine which fields to render (Requirement 8.2).
   */
  getEnabledMethods(): PaymentMethodConfig[] {
    return this.config
      .filter((m) => m.enabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Returns the configuration for a specific payment method.
   */
  getMethod(key: PaymentMethodKey): PaymentMethodConfig | undefined {
    return this.config.find((m) => m.key === key);
  }

  /**
   * Checks whether a specific payment method is enabled.
   */
  isMethodEnabled(key: PaymentMethodKey): boolean {
    const method = this.getMethod(key);
    return method?.enabled ?? false;
  }

  /**
   * Enables or disables a specific payment method at runtime.
   * Validates that at least one method remains enabled (Requirement 8.4).
   */
  setMethodEnabled(key: PaymentMethodKey, enabled: boolean): PaymentMethodConfigurationResult {
    const updated = this.config.map((m) =>
      m.key === key ? { ...m, enabled } : m
    );

    const validation = validatePaymentMethodConfig(updated);
    if (!validation.isValid) {
      return validation;
    }

    this.config = updated;
    return { methods: this.config, isValid: true };
  }

  /**
   * Loads a new configuration, replacing the current one.
   * Validates the configuration before applying it (Requirement 8.4).
   */
  loadConfig(methods: PaymentMethodConfig[]): PaymentMethodConfigurationResult {
    const validation = validatePaymentMethodConfig(methods);
    if (!validation.isValid) {
      return validation;
    }

    this.config = [...methods];
    return { methods: this.config, isValid: true };
  }

  /**
   * Applies partial overrides to the default configuration.
   * Useful for feature-flag driven configuration (Requirement 8.3).
   */
  applyOverrides(
    overrides: Partial<Record<PaymentMethodKey, Partial<PaymentMethodConfig>>>
  ): PaymentMethodConfigurationResult {
    const merged = mergePaymentMethodConfig(overrides);
    return this.loadConfig(merged);
  }

  /**
   * Resets the configuration back to the built-in defaults.
   */
  resetToDefaults(): void {
    this.config = [...DEFAULT_PAYMENT_METHODS];
  }

  /**
   * Returns whether wallet functionality is enabled.
   * When false, wallet-related fields and validation should be hidden (Requirement 8.5).
   */
  isWalletEnabled(): boolean {
    return this.isMethodEnabled('BILLETERA_VIRTUAL');
  }
}

/** Convenience export for the singleton instance */
export const paymentMethodConfigService = PaymentMethodConfigService.getInstance();
