# KRA Integration for Bulk Inventory Updates

This document describes the implementation of Kenya Revenue Authority (KRA) eTIMS compliance for bulk inventory updates in the restaurant POS system.

## Overview

The system now integrates with KRA APIs to ensure compliance with tax regulations when performing bulk inventory updates. The integration includes:

1. **Purchase Transactions** (`/insertTrnsPurchase`)
2. **Stock Movements** (`/insertStockIO`)
3. **Item Registration** (`/saveItem`)
4. **Transaction Monitoring** and audit trail

## Implementation Details

### 1. Enhanced KRA APIs

#### Purchase API (`/api/kra/purchase`)
- **Purpose**: Records purchase transactions with suppliers
- **Features**:
  - Uses selected supplier's details (TIN, business name)
  - Generates KRA-compliant invoice numbers (starting from 1)
  - Applies VAT amount as entered in the form
  - Maps items to proper KRA item classification codes
  - Includes transaction logging for audit purposes

#### Stock-In API (`/api/kra/stock-in-enhanced`)
- **Purpose**: Records stock movements for inventory updates
- **Features**:
  - Tracks stock-in transactions (SAR Type Code: 02 for purchases)
  - Generates unique SAR numbers for each transaction
  - Maps units to KRA unit codes
  - Includes transaction logging

#### Item Registration API (Enhanced)
- **Purpose**: Registers new items with KRA
- **Features**:
  - Uses category-based item classification codes
  - Generates unique item codes
  - Maps units to KRA unit codes

### 2. Item Classification Codes

The system uses the following KRA item classification codes based on product categories:

| Category | KRA Code | Description |
|----------|----------|-------------|
| Meats | 73131600 | Meat and poultry and seafood processing |
| Drinks | 50200000 | Beverages |
| Vegetables | 50400000 | Fresh vegetables |
| Package | 24120000 | Packaging materials |
| Dairy | 50130000 | Dairy products and eggs |
| Grains | 50130000 | Dairy (same as dairy per mapping) |
| Oil | 50150000 | Edible Oils and Fats |
| Fruits | 50300000 | Fresh fruits |
| Canned | 50460000 | Canned or jarred vegetables |
| Nuts | 50100000 | Nuts and seeds |

### 3. Transaction Flow

The bulk inventory update process follows this sequence:

1. **Item Registration**: Register items with KRA if they don't have item codes
2. **Supplier Order Creation**: Create supplier order in database
3. **Purchase Transaction**: Send purchase transaction to KRA
4. **Stock-In Transaction**: Send stock movement to KRA
5. **Local Inventory Update**: Update local inventory regardless of KRA status

### 4. Error Handling

- **Non-blocking**: Local inventory updates proceed even if KRA transactions fail
- **Transaction Logging**: All KRA API calls are logged for audit purposes
- **Retry Mechanism**: Failed transactions can be retried manually
- **Fallback**: System continues to function even when KRA is unavailable

### 5. Database Schema

#### New Tables

```sql
-- KRA transactions tracking table
CREATE TABLE kra_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kra_invoice_no INTEGER,
    kra_sar_no INTEGER,
    kra_result_code VARCHAR(10),
    kra_result_message TEXT,
    kra_receipt_data JSONB,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_order_id UUID REFERENCES supplier_orders(id),
    sales_invoice_id UUID REFERENCES sales_invoices(id),
    ingredient_id UUID REFERENCES ingredients(id),
    items_data JSONB,
    total_amount DECIMAL(15,2),
    vat_amount DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Enhanced Tables

- `supplier_orders`: Added `kra_purchase_id` and `kra_stock_in_id` fields
- `sales_invoices`: Added `kra_sale_id` field
- `ingredients`: Added `kra_registration_id` field

### 6. Monitoring and Dashboard

#### KRA Transaction Monitor Component

The system includes a monitoring component that provides:

- **Real-time Statistics**: Success rates, transaction counts, failure rates
- **Transaction History**: Recent KRA transactions with status and details
- **Filtering**: Filter by transaction type and status
- **Error Details**: View detailed error messages for failed transactions

### 7. API Endpoints

#### New Endpoints

- `POST /api/kra/purchase` - Send purchase transactions to KRA
- `POST /api/kra/stock-in-enhanced` - Send stock movements to KRA
- Enhanced `/api/kra/register-ingredient` - Improved item registration

#### Enhanced Endpoints

- All endpoints now include transaction logging
- Better error handling and reporting
- Improved item classification code generation

### 8. Configuration

#### Environment Variables

```env
KRA_TIN=P052380018M
KRA_BHF_ID=01
KRA_CMC_KEY=34D646A326104229B0098044E7E6623E9A32CFF4CEDE4701BBC3
```

#### KRA Config

The system uses the KRA sandbox environment for testing:
- **Base URL**: `https://etims-api-sbx.kra.go.ke/etims-api`
- **Endpoints**: Configured in `lib/kra-config.ts`

### 9. Usage

#### Bulk Inventory Update Process

1. **Select Items**: Choose ingredients to update
2. **Select Supplier**: Choose the supplier for the purchase
3. **Enter Details**: Provide invoice number and VAT amount
4. **Process**: System automatically:
   - Registers items with KRA (if needed)
   - Creates supplier order
   - Sends purchase transaction to KRA
   - Sends stock-in transaction to KRA
   - Updates local inventory
   - Logs all transactions

#### Monitoring

- Use the KRA Transaction Monitor component in the dashboard
- View transaction statistics and history
- Monitor success rates and identify issues
- Track failed transactions for manual intervention

### 10. Testing

#### Test Scenarios

1. **Successful Transaction**: Complete flow with all KRA APIs succeeding
2. **Failed KRA Purchase**: KRA purchase fails but local inventory updates
3. **Failed KRA Stock-In**: KRA stock-in fails but local inventory updates
4. **Item Registration**: New items are registered with KRA
5. **Network Issues**: System handles KRA API timeouts gracefully

#### Test Data

- Use the KRA sandbox environment for testing
- Test with various item categories to verify classification codes
- Test with different VAT amounts and supplier details

### 11. Deployment

#### Production Considerations

1. **Environment Variables**: Update KRA credentials for production
2. **Database Migration**: Run the KRA transactions table migration
3. **Monitoring**: Set up alerts for KRA transaction failures
4. **Backup**: Ensure KRA transaction logs are backed up
5. **Compliance**: Verify all transactions are properly logged for audit

### 12. Troubleshooting

#### Common Issues

1. **KRA API Timeouts**: Check network connectivity and KRA service status
2. **Invalid Item Codes**: Verify item classification codes are correct
3. **Transaction Failures**: Check KRA error messages in transaction logs
4. **Missing Supplier Details**: Ensure suppliers have proper TIN and business details

#### Debug Information

- All KRA API calls are logged with full request/response data
- Transaction status is tracked in the `kra_transactions` table
- Error details are stored for failed transactions
- Console logs provide detailed debugging information

### 13. Future Enhancements

#### Planned Features

1. **Automatic Retry**: Implement automatic retry for failed transactions
2. **Batch Processing**: Support for batch KRA transactions
3. **Advanced Monitoring**: Real-time alerts and notifications
4. **Compliance Reports**: Generate KRA compliance reports
5. **Integration Testing**: Automated testing for KRA APIs

#### API Extensions

1. **Sales Transactions**: Enhanced sales transaction handling
2. **Stock Master**: KRA stock master synchronization
3. **Customer Management**: KRA customer registration
4. **Branch Management**: Multi-branch KRA compliance

## Conclusion

This implementation provides a robust, compliant, and monitored KRA integration for bulk inventory updates. The system ensures tax compliance while maintaining operational efficiency and providing comprehensive audit trails for regulatory requirements. 