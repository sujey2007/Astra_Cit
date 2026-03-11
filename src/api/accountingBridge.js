/**
 * AstraCIT ERP Bridge Engine
 * Standardizes Blockchain Ledger entries for Enterprise Ingestion
 */

export const generateTallyXML = (item) => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `
<ENVELOPE>
    <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
    <BODY>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER VCHTYPE="Payment" ACTION="Create">
                <DATE>${dateStr}</DATE>
                <NARRATION>Material: ${item.itemName} | Blockchain Seal: ${item.digitalSeal?.substring(0, 12)}</NARRATION>
                <VOUCHERNUMBER>${item.transactionId || 'CIT-AC-001'}</VOUCHERNUMBER>
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${item.vendorName}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                    <AMOUNT>-${item.totalAmount || item.totalCost}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
        </TALLYMESSAGE>
    </BODY>
</ENVELOPE>`;
};

export const generateSAPJSON = (item) => {
  return JSON.stringify({
    "Header": {
      "CompanyCode": "CIT_INDIA",
      "DocType": "ZP",
      "BlockchainSeal": item.digitalSeal,
      "IntegrityStatus": "VERIFIED"
    },
    "LineItems": [
      {
        "Account": item.vendorName,
        "DebitCredit": "S",
        "Amount": item.totalAmount || item.totalCost,
        "Currency": "INR",
        "Text": `Secure Settlement: ${item.itemName}`
      }
    ]
  }, null, 2);
};