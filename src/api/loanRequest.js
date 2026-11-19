const loanInputFields=['loan_form','loan_type','product_id','institution_name','product_name','repayment_method','original_principal','remaining_principal','annual_rate','rate_type','rate_reset_months','next_rate_reset_date','start_date','maturity_date','payment_day','contractual_monthly_payment','grace_months','post_grace_method','prepayment_policy','prepayment_fee_method','prepayment_fee_rate','fee_start_date','fee_end_date','fee_exempt','initial_savings_balance']

// The backend rejects read-only DTO fields and numeric strings.
export function previewLoanInput(dto){return Object.fromEntries(loanInputFields.filter(key=>dto[key]!==undefined).map(key=>[key,dto[key]]))}
export function loanFormInput(form){return {
  loan_form:'GENERAL',loan_type:form.loan_type,product_id:form.product_id==null?null:Number(form.product_id),institution_name:form.bank,product_name:form.product,repayment_method:form.method,
  original_principal:Number(form.original),remaining_principal:Number(form.balance),annual_rate:Number(form.rate),rate_type:form.variable?'VARIABLE':'FIXED',rate_reset_months:form.variable?6:null,
  start_date:form.start,maturity_date:form.maturity,payment_day:Number(form.day),contractual_monthly_payment:form.payment===''?null:Number(form.payment),
  grace_months:form.method==='GRACE_INSTALLMENT'?Number(form.graceMonths):0,post_grace_method:form.method==='GRACE_INSTALLMENT'?form.postGraceMethod:null,
  prepayment_policy:form.method==='BULLET'?null:form.changeMode==='payment'?'KEEP_MATURITY':'KEEP_PAYMENT',prepayment_fee_method:form.feeStatus==='exempt'?'NONE':form.feeStatus==='yes'?'FIXED':'UNKNOWN',prepayment_fee_rate:form.feeStatus==='yes'?Number(form.feeRate):null,fee_exempt:form.feeStatus==='exempt'?true:null,
}}
