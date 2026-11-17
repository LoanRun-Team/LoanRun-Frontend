// Success response examples from docs/api-spec-v2 (final supplied API specification).
export default {
  "POST /api/reports/": {
    "success": true,
    "code": "REPORT_GENERATE_ACCEPTED",
    "message": "리포트 생성 요청을 접수했습니다.",
    "data": {
      "report_id": 101,
      "status": "PENDING",
      "poll_url": "/api/reports/101/",
      "generated_at": null,
      "data_revision": "rev-20261116-1"
    }
  },
  "GET /api/payments/monthly-summary/": {
    "success": true,
    "code": "PAYMENT_MONTHLY_SUMMARY_SUCCESS",
    "message": "구간 기록·월별 상환 통계 정보를 조회했습니다.",
    "data": {
      "months": [
        {
          "year_month": "2026-11",
          "target_amount": 380000,
          "actual_amount": 380000,
          "principal_amount": 250000,
          "interest_amount": 30000,
          "extra_amount": 100000,
          "difference": 0,
          "payment_count": 1,
          "data_status": "RECORDED",
          "fee_amount": 0,
          "savings_used_amount": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "monthly_start_principal": 6000000,
          "monthly_principal_repayment_rate": 5.83,
          "observed": true
        }
      ]
    }
  },
  "POST /api/risks/simulate/": {
    "success": true,
    "code": "RISK_SIMULATION_SUCCESS",
    "message": "금리·소득 변화 시뮬레이션 처리를 완료했습니다.",
    "data": {
      "baseline": {
        "income": 3500000,
        "monthly_payment": 280000,
        "available_cash": 740000,
        "level": "STABLE",
        "score": 7.5
      },
      "scenario": {
        "income": 3500000,
        "monthly_payment": 280000,
        "available_cash": 740000,
        "level": "STABLE",
        "payoff_feasibility": "HIGH",
        "score": 7.5,
        "expense_increase_amount": 0,
        "emergency_coverage_months": null,
        "emergency_coverage_status": "NOT_NEEDED",
        "one_time_shortfall": 0,
        "rate_increase_pp": 1,
        "income_change_pct": 0
      },
      "delta": {
        "income": 0,
        "monthly_payment": 0,
        "available_cash": 0
      },
      "warnings": [
        "고정금리 대출에는 금리 상승폭이 적용되지 않습니다."
      ],
      "rate_thresholds": {
        "reduce_extra_from": null,
        "basic_at_risk_from": null
      },
      "income_thresholds": {
        "reduce_extra_from": 18.29,
        "basic_at_risk_from": 21.15
      },
      "expense_thresholds": {
        "reduce_extra_from": 640001,
        "basic_at_risk_from": 740001
      },
      "scenario_type": "RATE_UP"
    }
  },
  "PUT /api/budgets/profile/": {
    "success": true,
    "code": "FINANCE_PROFILE_SAVE_SUCCESS",
    "message": "기본 재정정보 등록·수정 처리를 완료했습니다.",
    "data": {
      "monthly_income": 3500000,
      "income_type": "REGULAR",
      "payday": 25,
      "essential_expenses": 1200000,
      "discretionary_expenses": 780000,
      "savings": 500000,
      "emergency_fund": 1000000,
      "fixed_essential_expenses": 800000,
      "variable_essential_expenses": 400000
    }
  },
  "GET /api/budgets/profile/": {
    "success": true,
    "code": "FINANCE_PROFILE_DETAIL_SUCCESS",
    "message": "기본 재정정보 정보를 조회했습니다.",
    "data": {
      "monthly_income": 3500000,
      "income_type": "REGULAR",
      "payday": 25,
      "essential_expenses": 1200000,
      "discretionary_expenses": 780000,
      "savings": 500000,
      "emergency_fund": 1000000,
      "fixed_essential_expenses": 800000,
      "variable_essential_expenses": 400000
    }
  },
  "POST /api/payments/": {
    "success": true,
    "code": "PAYMENT_CREATE_SUCCESS",
    "message": "납부 기록을 등록했습니다.",
    "data": {
      "payment": {
        "payment_id": 51,
        "loan_id": 1,
        "paid_at": "2026-11-15",
        "amount": 280000,
        "payment_type": "REGULAR",
        "due_item_id": 21,
        "principal_amount": 250000,
        "interest_amount": 30000,
        "extra_amount": 0,
        "created_at": "2026-11-15T10:00:00+09:00",
        "fee_amount": 0,
        "savings_used_amount": 0,
        "editable": true,
        "delay_days": 0,
        "due_allocations": [
          {
            "due_item_id": 21,
            "required_paid_amount": 280000,
            "delay_days": 0
          }
        ]
      },
      "remaining_principal": 5750000,
      "updated_schedule": {
        "due_item_id": 21,
        "loan_id": 1,
        "due_date": "2026-11-25",
        "required_amount": 280000,
        "planned_extra_amount": 100000,
        "paid_required_amount": 280000,
        "paid_extra_amount": 0,
        "outstanding_amount": 0,
        "status": "PAID",
        "product_name": "예시 신용대출",
        "total_planned_amount": 380000,
        "display_status": "PAID",
        "remaining_extra_amount": 100000,
        "unpaid_confirmed": false,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0
      },
      "updated_plan": {
        "loan_id": 1,
        "mode": "EXTRA_AMOUNT",
        "preference": null,
        "target_date": null,
        "extra_monthly_payment": 100000,
        "monthly_amount": 380000,
        "estimated_payoff_date": "2028-04-25",
        "estimated_total_interest": 272250,
        "effective_date": "2026-11-25",
        "target_payoff_date": "2028-04-25",
        "projected_payoff_date": "2028-04-25",
        "repayment_category": "INSTALLMENT",
        "planned_progress_pct": 0,
        "actual_progress_pct": 4.17,
        "planned_extra_amount": 100000,
        "actual_extra_amount": 0,
        "extra_gap_amount": -100000,
        "payoff_delay_months": 0,
        "track": {
          "status": "ON_TRACK",
          "data_status": "SUFFICIENT",
          "regular_due_status": "PAID"
        },
        "cumulative_planned_extra_amount": 0,
        "cumulative_actual_extra_amount": 0,
        "cumulative_extra_gap_amount": 0,
        "priority": null,
        "d_day": 526,
        "estimated_total_fee": null,
        "savings_balance": 0,
        "required_monthly_saving": 0,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0,
        "cumulative_planned_saving_amount": 0,
        "cumulative_actual_saving_amount": 0,
        "saving_gap_amount": null,
        "saving_progress_pct": null,
        "projection_source": "FALLBACK_PLAN",
        "observed_month_count": 0,
        "plan_start_principal": 6000000,
        "regular_due_status": "PAID",
        "extra_achievement_pct": null,
        "affordability_gap_amount": 0,
        "warnings": []
      },
      "report_stale": true
    }
  },
  "DELETE /api/payments/{payment_id}/": {
    "success": true,
    "code": "PAYMENT_DELETE_SUCCESS",
    "message": "납부 기록을 삭제했습니다.",
    "data": {
      "payment_id": 51,
      "deleted": true,
      "remaining_principal": 6000000,
      "schedule_status": "UPCOMING",
      "report_stale": true
    }
  },
  "GET /api/payments/{payment_id}/": {
    "success": true,
    "code": "PAYMENT_DETAIL_SUCCESS",
    "message": "납부 기록 상세 정보를 조회했습니다.",
    "data": {
      "payment_id": 51,
      "loan_id": 1,
      "paid_at": "2026-11-25",
      "amount": 380000,
      "payment_type": "REGULAR",
      "due_item_id": 21,
      "principal_amount": 250000,
      "interest_amount": 30000,
      "extra_amount": 100000,
      "created_at": "2026-11-25T10:00:00+09:00",
      "fee_amount": 0,
      "savings_used_amount": 0,
      "editable": true,
      "delay_days": 0,
      "due_allocations": [
        {
          "due_item_id": 21,
          "required_paid_amount": 280000,
          "delay_days": 0
        }
      ]
    }
  },
  "PATCH /api/payments/{payment_id}/": {
    "success": true,
    "code": "PAYMENT_UPDATE_SUCCESS",
    "message": "납부 기록을 수정했습니다.",
    "data": {
      "payment": {
        "payment_id": 51,
        "loan_id": 1,
        "paid_at": "2026-11-25",
        "amount": 350000,
        "payment_type": "REGULAR",
        "due_item_id": 21,
        "principal_amount": 250000,
        "interest_amount": 30000,
        "extra_amount": 70000,
        "created_at": "2026-11-25T10:00:00+09:00",
        "fee_amount": 0,
        "savings_used_amount": 0,
        "editable": true,
        "delay_days": 0,
        "due_allocations": [
          {
            "due_item_id": 21,
            "required_paid_amount": 280000,
            "delay_days": 0
          }
        ]
      },
      "remaining_principal": 5680000,
      "schedule_status": "PAID",
      "recalculated": true,
      "report_stale": true
    }
  },
  "PATCH /api/users/me/": {
    "success": true,
    "code": "USER_UPDATE_SUCCESS",
    "message": "프로필을 수정했습니다.",
    "data": {
      "user_id": 1,
      "email": "demo@example.com",
      "name": "민준",
      "occupation": "프리랜서",
      "income_type": "IRREGULAR",
      "onboarding_completed": true,
      "plan_type": "PRO"
    }
  },
  "GET /api/users/me/": {
    "success": true,
    "code": "USER_DETAIL_SUCCESS",
    "message": "프로필을 조회했습니다.",
    "data": {
      "user_id": 1,
      "email": "demo@example.com",
      "name": "민준",
      "occupation": "직장인",
      "income_type": "REGULAR",
      "onboarding_completed": true,
      "plan_type": "PRO"
    }
  },
  "POST /api/loans/{loan_id}/rate-history/": {
    "success": true,
    "code": "LOAN_RATE_UPDATE_SUCCESS",
    "message": "대출 금리 변경 등록 처리를 완료했습니다.",
    "data": {
      "rate_record": {
        "rate_id": 5,
        "loan_id": 1,
        "effective_date": "2026-11-15",
        "previous_rate": 5.8,
        "new_rate": 6,
        "source": "MANUAL"
      },
      "loan": {
        "loan_id": 1,
        "product_id": 11,
        "institution_name": "예시은행",
        "product_name": "예시 신용대출",
        "loan_type": "CREDIT",
        "loan_form": "GENERAL",
        "repayment_method": "EQUAL_PRINCIPAL",
        "original_principal": 9000000,
        "remaining_principal": 6000000,
        "annual_rate": 6,
        "rate_type": "VARIABLE",
        "rate_reset_months": 6,
        "next_rate_reset_date": "2027-05-15",
        "start_date": "2025-10-25",
        "maturity_date": "2028-10-25",
        "payment_day": 25,
        "grace_months": 0,
        "post_grace_method": null,
        "contractual_monthly_payment": 280000,
        "estimated_monthly_payment": 280000,
        "paid_principal": 3000000,
        "progress_percent": 33.33,
        "status": "ACTIVE",
        "as_of": "2026-11-15",
        "repayment_category": "INSTALLMENT",
        "rate_source": "MANUAL",
        "rate_updated_at": "2026-11-15T09:00:00+09:00",
        "rate_link_consent": false,
        "rate_sync_status": "MANUAL_REQUIRED",
        "prepayment_policy": "KEEP_PAYMENT",
        "prepayment_fee_method": "UNKNOWN",
        "prepayment_fee_rate": null,
        "fee_start_date": null,
        "fee_end_date": null,
        "fee_exempt": null,
        "savings_balance": 0,
        "required_monthly_saving": 0,
        "snapshot_date": "2026-11-15",
        "snapshot_principal": 6000000
      },
      "estimated_monthly_payment": 280000,
      "recalculated_plan": {
        "loan_id": 1,
        "mode": "EXTRA_AMOUNT",
        "preference": null,
        "target_date": null,
        "extra_monthly_payment": 100000,
        "monthly_amount": 380000,
        "estimated_payoff_date": "2028-04-25",
        "estimated_total_interest": 272250,
        "effective_date": "2026-11-25",
        "target_payoff_date": "2028-04-25",
        "projected_payoff_date": "2028-04-25",
        "repayment_category": "INSTALLMENT",
        "planned_progress_pct": 0,
        "actual_progress_pct": 0,
        "planned_extra_amount": 100000,
        "actual_extra_amount": 0,
        "extra_gap_amount": -100000,
        "payoff_delay_months": 0,
        "track": {
          "status": "ON_TRACK",
          "data_status": "SUFFICIENT",
          "regular_due_status": "UPCOMING"
        },
        "cumulative_planned_extra_amount": 0,
        "cumulative_actual_extra_amount": 0,
        "cumulative_extra_gap_amount": 0,
        "priority": null,
        "d_day": 526,
        "estimated_total_fee": null,
        "savings_balance": 0,
        "required_monthly_saving": 0,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0,
        "cumulative_planned_saving_amount": 0,
        "cumulative_actual_saving_amount": 0,
        "saving_gap_amount": null,
        "saving_progress_pct": null,
        "projection_source": "FALLBACK_PLAN",
        "observed_month_count": 0,
        "plan_start_principal": 6000000,
        "regular_due_status": "UPCOMING",
        "extra_achievement_pct": null,
        "affordability_gap_amount": 0,
        "warnings": []
      }
    }
  },
  "GET /api/loans/{loan_id}/rate-history/": {
    "success": true,
    "code": "LOAN_RATE_HISTORY_SUCCESS",
    "message": "대출 금리 변경 이력 정보를 조회했습니다.",
    "data": {
      "loan_id": 1,
      "rates": [
        {
          "rate_id": 5,
          "loan_id": 1,
          "effective_date": "2026-11-15",
          "previous_rate": 5.8,
          "new_rate": 6,
          "source": "MANUAL"
        }
      ]
    }
  },
  "POST /api/loans/": {
    "success": true,
    "code": "LOAN_CREATE_SUCCESS",
    "message": "대출 정보를 등록했습니다.",
    "data": {
      "loan_id": 1,
      "product_id": 11,
      "institution_name": "예시은행",
      "product_name": "예시 신용대출",
      "loan_type": "CREDIT",
      "loan_form": "GENERAL",
      "repayment_method": "EQUAL_PRINCIPAL",
      "original_principal": 9000000,
      "remaining_principal": 6000000,
      "annual_rate": 6,
      "rate_type": "FIXED",
      "rate_reset_months": null,
      "next_rate_reset_date": null,
      "start_date": "2025-10-25",
      "maturity_date": "2028-10-25",
      "payment_day": 25,
      "grace_months": 0,
      "post_grace_method": null,
      "contractual_monthly_payment": 280000,
      "estimated_monthly_payment": 280000,
      "paid_principal": 3000000,
      "progress_percent": 33.33,
      "status": "ACTIVE",
      "as_of": "2026-11-15",
      "repayment_category": "INSTALLMENT",
      "rate_source": "MANUAL",
      "rate_updated_at": "2026-11-15T09:00:00+09:00",
      "rate_link_consent": false,
      "rate_sync_status": "NOT_APPLICABLE",
      "prepayment_policy": "KEEP_PAYMENT",
      "prepayment_fee_method": "UNKNOWN",
      "prepayment_fee_rate": null,
      "fee_start_date": null,
      "fee_end_date": null,
      "fee_exempt": null,
      "savings_balance": 0,
      "required_monthly_saving": 0,
      "snapshot_date": "2026-11-15",
      "snapshot_principal": 6000000
    }
  },
  "POST /api/loans/preview/": {
    "success": true,
    "code": "LOAN_PREVIEW_SUCCESS",
    "message": "기본 월 상환액을 계산했습니다.",
    "data": {
      "estimated_monthly_payment": 280000,
      "contractual_monthly_payment": 280000,
      "estimated_next_principal": 250000,
      "estimated_next_interest": 30000,
      "maturity_date": "2028-10-25",
      "remaining_months": 24,
      "warnings": [
        "중도상환수수료·연체이자 미제공. 실제 계약상 부분상환 가능 여부와 수수료를 확인하세요."
      ],
      "repayment_category": "INSTALLMENT",
      "prepayment_policy": "KEEP_PAYMENT",
      "estimated_total_fee": null,
      "required_monthly_saving": 0
    }
  },
  "DELETE /api/loans/{loan_id}/": {
    "success": true,
    "code": "LOAN_DELETE_SUCCESS",
    "message": "대출을 삭제했습니다.",
    "data": {
      "loan_id": 1,
      "deleted": true,
      "status": "DELETED"
    }
  },
  "GET /api/loans/{loan_id}/": {
    "success": true,
    "code": "LOAN_DETAIL_SUCCESS",
    "message": "대출 상세 정보를 조회했습니다.",
    "data": {
      "loan_id": 1,
      "product_id": 11,
      "institution_name": "예시은행",
      "product_name": "예시 신용대출",
      "loan_type": "CREDIT",
      "loan_form": "GENERAL",
      "repayment_method": "EQUAL_PRINCIPAL",
      "original_principal": 9000000,
      "remaining_principal": 6000000,
      "annual_rate": 6,
      "rate_type": "FIXED",
      "rate_reset_months": null,
      "next_rate_reset_date": null,
      "start_date": "2025-10-25",
      "maturity_date": "2028-10-25",
      "payment_day": 25,
      "grace_months": 0,
      "post_grace_method": null,
      "contractual_monthly_payment": 280000,
      "estimated_monthly_payment": 280000,
      "paid_principal": 3000000,
      "progress_percent": 33.33,
      "status": "ACTIVE",
      "as_of": "2026-11-15",
      "estimated_remaining_interest": 272250,
      "next_payment": {
        "due_item_id": 21,
        "loan_id": 1,
        "due_date": "2026-11-25",
        "required_amount": 280000,
        "planned_extra_amount": 100000,
        "paid_required_amount": 0,
        "paid_extra_amount": 0,
        "outstanding_amount": 280000,
        "status": "UPCOMING",
        "product_name": "예시 신용대출",
        "total_planned_amount": 380000,
        "display_status": "UPCOMING",
        "remaining_extra_amount": 100000,
        "unpaid_confirmed": false,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0
      },
      "plan": {
        "loan_id": 1,
        "mode": "EXTRA_AMOUNT",
        "preference": null,
        "target_date": null,
        "extra_monthly_payment": 100000,
        "monthly_amount": 380000,
        "estimated_payoff_date": "2028-04-25",
        "estimated_total_interest": 272250,
        "effective_date": "2026-11-25",
        "target_payoff_date": "2028-04-25",
        "projected_payoff_date": "2028-04-25",
        "repayment_category": "INSTALLMENT",
        "planned_progress_pct": 0,
        "actual_progress_pct": 0,
        "planned_extra_amount": 100000,
        "actual_extra_amount": 0,
        "extra_gap_amount": -100000,
        "payoff_delay_months": 0,
        "track": {
          "status": "ON_TRACK",
          "data_status": "SUFFICIENT",
          "regular_due_status": "UPCOMING"
        },
        "cumulative_planned_extra_amount": 0,
        "cumulative_actual_extra_amount": 0,
        "cumulative_extra_gap_amount": 0,
        "priority": null,
        "d_day": 526,
        "estimated_total_fee": null,
        "savings_balance": 0,
        "required_monthly_saving": 0,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0,
        "cumulative_planned_saving_amount": 0,
        "cumulative_actual_saving_amount": 0,
        "saving_gap_amount": null,
        "saving_progress_pct": null,
        "projection_source": "FALLBACK_PLAN",
        "observed_month_count": 0,
        "plan_start_principal": 6000000,
        "regular_due_status": "UPCOMING",
        "extra_achievement_pct": null,
        "affordability_gap_amount": 0,
        "warnings": []
      },
      "repayment_category": "INSTALLMENT",
      "rate_source": "MANUAL",
      "rate_updated_at": "2026-11-15T09:00:00+09:00",
      "rate_link_consent": false,
      "rate_sync_status": "NOT_APPLICABLE",
      "prepayment_policy": "KEEP_PAYMENT",
      "prepayment_fee_method": "UNKNOWN",
      "prepayment_fee_rate": null,
      "fee_start_date": null,
      "fee_end_date": null,
      "fee_exempt": null,
      "savings_balance": 0,
      "required_monthly_saving": 0,
      "snapshot_date": "2026-11-15",
      "snapshot_principal": 6000000,
      "estimated_total_fee": null
    }
  },
  "PATCH /api/loans/{loan_id}/": {
    "success": true,
    "code": "LOAN_UPDATE_SUCCESS",
    "message": "대출 정보를 수정했습니다.",
    "data": {
      "loan_id": 1,
      "product_id": 11,
      "institution_name": "예시은행",
      "product_name": "예시 신용대출",
      "loan_type": "CREDIT",
      "loan_form": "GENERAL",
      "repayment_method": "EQUAL_PRINCIPAL",
      "original_principal": 9000000,
      "remaining_principal": 6000000,
      "annual_rate": 6,
      "rate_type": "FIXED",
      "rate_reset_months": null,
      "next_rate_reset_date": null,
      "start_date": "2025-10-25",
      "maturity_date": "2028-10-25",
      "payment_day": 25,
      "grace_months": 0,
      "post_grace_method": null,
      "contractual_monthly_payment": 280000,
      "estimated_monthly_payment": 280000,
      "paid_principal": 3000000,
      "progress_percent": 33.33,
      "status": "ACTIVE",
      "as_of": "2026-11-15",
      "repayment_category": "INSTALLMENT",
      "rate_source": "MANUAL",
      "rate_updated_at": "2026-11-15T09:00:00+09:00",
      "rate_link_consent": false,
      "rate_sync_status": "NOT_APPLICABLE",
      "prepayment_policy": "KEEP_PAYMENT",
      "prepayment_fee_method": "UNKNOWN",
      "prepayment_fee_rate": null,
      "fee_start_date": null,
      "fee_end_date": null,
      "fee_exempt": null,
      "savings_balance": 0,
      "required_monthly_saving": 0,
      "snapshot_date": "2026-11-15",
      "snapshot_principal": 6000000
    }
  },
  "GET /api/loan-products/options/": {
    "success": true,
    "code": "LOAN_PRODUCT_OPTIONS_SUCCESS",
    "message": "대출 종류·은행 목록 정보를 조회했습니다.",
    "data": {
      "loan_types": [
        {
          "code": "CREDIT",
          "label": "신용대출"
        },
        {
          "code": "MORTGAGE",
          "label": "주택담보대출"
        },
        {
          "code": "JEONSE",
          "label": "전세자금대출"
        },
        {
          "code": "STUDENT",
          "label": "학자금대출"
        },
        {
          "code": "AUTO",
          "label": "자동차대출"
        },
        {
          "code": "OTHER",
          "label": "기타"
        }
      ],
      "institutions": [
        {
          "institution_id": 1,
          "name": "예시은행"
        }
      ]
    }
  },
  "PATCH /api/reports/comparison-settings/": {
    "success": true,
    "code": "REPORT_COMPARISON_SETTINGS_UPDATE_SUCCESS",
    "message": "비교 기준 및 동의를 저장했습니다.",
    "data": {
      "consented": true,
      "age_group": "AGE_20S",
      "source_type": "DEMO",
      "regeneration_required": true,
      "income_decile": 3
    }
  },
  "GET /api/reports/comparison-settings/": {
    "success": true,
    "code": "REPORT_COMPARISON_SETTINGS_SUCCESS",
    "message": "또래 비교 기준·동의 정보를 조회했습니다.",
    "data": {
      "consented": true,
      "age_group": "AGE_20S",
      "source_type": "DEMO",
      "income_decile": 3
    }
  },
  "POST /api/auth/logout/": {
    "success": true,
    "code": "LOGOUT_SUCCESS",
    "message": "로그아웃했습니다.",
    "data": {
      "logged_out": true
    }
  },
  "POST /api/auth/login/": {
    "success": true,
    "code": "LOGIN_SUCCESS",
    "message": "로그인했습니다.",
    "data": {
      "access_token": "sample.access.token",
      "refresh_token": "sample.refresh.token",
      "token_type": "Bearer",
      "user": {
        "user_id": 1,
        "email": "demo@example.com",
        "name": "민준",
        "occupation": "직장인",
        "income_type": "REGULAR",
        "onboarding_completed": false,
        "plan_type": "PRO"
      }
    }
  },
  "POST /api/auth/refresh/": {
    "success": true,
    "code": "TOKEN_REFRESH_SUCCESS",
    "message": "로그인 토큰을 갱신했습니다.",
    "data": {
      "access_token": "sample.new.access.token",
      "token_type": "Bearer"
    }
  },
  "GET /api/loans/": {
    "success": true,
    "code": "LOAN_LIST_SUCCESS",
    "message": "보유 대출 목록 정보를 조회했습니다.",
    "data": {
      "loans": [
        {
          "loan_id": 1,
          "product_id": 11,
          "institution_name": "예시은행",
          "product_name": "예시 신용대출",
          "loan_type": "CREDIT",
          "loan_form": "GENERAL",
          "repayment_method": "EQUAL_PRINCIPAL",
          "original_principal": 9000000,
          "remaining_principal": 6000000,
          "annual_rate": 6,
          "rate_type": "FIXED",
          "rate_reset_months": null,
          "next_rate_reset_date": null,
          "start_date": "2025-10-25",
          "maturity_date": "2028-10-25",
          "payment_day": 25,
          "grace_months": 0,
          "post_grace_method": null,
          "contractual_monthly_payment": 280000,
          "estimated_monthly_payment": 280000,
          "paid_principal": 3000000,
          "progress_percent": 33.33,
          "status": "ACTIVE",
          "as_of": "2026-11-15",
          "repayment_category": "INSTALLMENT",
          "rate_source": "MANUAL",
          "rate_updated_at": "2026-11-15T09:00:00+09:00",
          "rate_link_consent": false,
          "rate_sync_status": "NOT_APPLICABLE",
          "prepayment_policy": "KEEP_PAYMENT",
          "prepayment_fee_method": "UNKNOWN",
          "prepayment_fee_rate": null,
          "fee_start_date": null,
          "fee_end_date": null,
          "fee_exempt": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "snapshot_date": "2026-11-15",
          "snapshot_principal": 6000000
        }
      ],
      "total_remaining_principal": 6000000,
      "total_monthly_due": 280000,
      "estimated_payoff_date": "2028-04-25",
      "count": 1
    }
  },
  "POST /api/repayment-plans/preview/": {
    "success": true,
    "code": "REPAYMENT_PLAN_PREVIEW_SUCCESS",
    "message": "상환 계획을 계산했습니다.",
    "data": {
      "current_plans": [
        {
          "loan_id": 1,
          "mode": "MATURITY",
          "preference": null,
          "target_date": "2028-10-25",
          "extra_monthly_payment": 0,
          "monthly_amount": 280000,
          "estimated_payoff_date": "2028-10-25",
          "estimated_total_interest": 375000,
          "effective_date": "2026-11-25",
          "target_payoff_date": "2028-10-25",
          "projected_payoff_date": "2028-10-25",
          "repayment_category": "INSTALLMENT",
          "planned_progress_pct": 0,
          "actual_progress_pct": 0,
          "planned_extra_amount": 0,
          "actual_extra_amount": 0,
          "extra_gap_amount": 0,
          "payoff_delay_months": 0,
          "track": {
            "status": "ON_TRACK",
            "data_status": "SUFFICIENT",
            "regular_due_status": "UPCOMING"
          },
          "cumulative_planned_extra_amount": 0,
          "cumulative_actual_extra_amount": 0,
          "cumulative_extra_gap_amount": 0,
          "priority": null,
          "d_day": 526,
          "estimated_total_fee": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "cumulative_planned_saving_amount": 0,
          "cumulative_actual_saving_amount": 0,
          "saving_gap_amount": null,
          "saving_progress_pct": null,
          "projection_source": "FALLBACK_PLAN",
          "observed_month_count": 0,
          "plan_start_principal": 6000000,
          "regular_due_status": "UPCOMING",
          "extra_achievement_pct": null,
          "affordability_gap_amount": 0,
          "warnings": []
        }
      ],
      "proposed_plans": [
        {
          "loan_id": 1,
          "mode": "EXTRA_AMOUNT",
          "preference": null,
          "target_date": null,
          "extra_monthly_payment": 100000,
          "monthly_amount": 380000,
          "estimated_payoff_date": "2028-04-25",
          "estimated_total_interest": 272250,
          "effective_date": "2026-11-25",
          "target_payoff_date": "2028-04-25",
          "projected_payoff_date": "2028-04-25",
          "repayment_category": "INSTALLMENT",
          "planned_progress_pct": 0,
          "actual_progress_pct": 0,
          "planned_extra_amount": 100000,
          "actual_extra_amount": 0,
          "extra_gap_amount": -100000,
          "payoff_delay_months": 0,
          "track": {
            "status": "ON_TRACK",
            "data_status": "SUFFICIENT",
            "regular_due_status": "UPCOMING"
          },
          "cumulative_planned_extra_amount": 0,
          "cumulative_actual_extra_amount": 0,
          "cumulative_extra_gap_amount": 0,
          "priority": null,
          "d_day": 526,
          "estimated_total_fee": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "cumulative_planned_saving_amount": 0,
          "cumulative_actual_saving_amount": 0,
          "saving_gap_amount": null,
          "saving_progress_pct": null,
          "projection_source": "FALLBACK_PLAN",
          "observed_month_count": 0,
          "plan_start_principal": 6000000,
          "regular_due_status": "UPCOMING",
          "extra_achievement_pct": null,
          "affordability_gap_amount": 0,
          "warnings": []
        }
      ],
      "estimated_payoff_date": "2028-04-25",
      "estimated_total_interest": 272250,
      "monthly_burden": 380000,
      "delta": {
        "payoff_months_saved": 6,
        "interest_saving": 102750,
        "monthly_burden_delta": 100000
      },
      "warnings": [
        "중도상환수수료·연체이자 미제공. 실제 계약상 부분상환 가능 여부와 수수료를 확인하세요."
      ],
      "preview_version": "plan-v1-demo",
      "strategy_code": "NONE",
      "strategy_version": null,
      "current_strategy_code": "NONE",
      "current_allocations": [
        {
          "loan_id": 1,
          "amount": 0,
          "priority": null,
          "allocation_type": "EXTRA_PAYMENT",
          "actual_amount": 0
        }
      ],
      "proposed_allocations": [
        {
          "loan_id": 1,
          "amount": 100000,
          "priority": null,
          "allocation_type": "EXTRA_PAYMENT",
          "actual_amount": 0
        }
      ],
      "estimated_total_fee": null,
      "data_revision": "rev-20261116-1"
    }
  },
  "PUT /api/repayment-plans/": {
    "success": true,
    "code": "REPAYMENT_PLAN_SAVE_SUCCESS",
    "message": "상환 계획을 저장했습니다.",
    "data": {
      "plans": [
        {
          "loan_id": 1,
          "mode": "EXTRA_AMOUNT",
          "preference": null,
          "target_date": null,
          "extra_monthly_payment": 100000,
          "monthly_amount": 380000,
          "estimated_payoff_date": "2028-04-25",
          "estimated_total_interest": 272250,
          "effective_date": "2026-11-25",
          "target_payoff_date": "2028-04-25",
          "projected_payoff_date": "2028-04-25",
          "repayment_category": "INSTALLMENT",
          "planned_progress_pct": 0,
          "actual_progress_pct": 0,
          "planned_extra_amount": 100000,
          "actual_extra_amount": 0,
          "extra_gap_amount": -100000,
          "payoff_delay_months": 0,
          "track": {
            "status": "ON_TRACK",
            "data_status": "SUFFICIENT",
            "regular_due_status": "UPCOMING"
          },
          "cumulative_planned_extra_amount": 0,
          "cumulative_actual_extra_amount": 0,
          "cumulative_extra_gap_amount": 0,
          "priority": null,
          "d_day": 526,
          "estimated_total_fee": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "cumulative_planned_saving_amount": 0,
          "cumulative_actual_saving_amount": 0,
          "saving_gap_amount": null,
          "saving_progress_pct": null,
          "projection_source": "FALLBACK_PLAN",
          "observed_month_count": 0,
          "plan_start_principal": 6000000,
          "regular_due_status": "UPCOMING",
          "extra_achievement_pct": null,
          "affordability_gap_amount": 0,
          "warnings": []
        }
      ],
      "effective_date": "2026-11-25",
      "estimated_payoff_date": "2028-04-25",
      "estimated_total_interest": 272250,
      "monthly_burden": 380000,
      "plan_version": "plan-v2-demo",
      "strategy_code": "NONE",
      "overall_plan_exists": false,
      "allocations": [
        {
          "loan_id": 1,
          "amount": 100000,
          "priority": null,
          "allocation_type": "EXTRA_PAYMENT",
          "actual_amount": 0
        }
      ],
      "estimated_total_fee": null,
      "data_revision": "rev-20261116-1"
    }
  },
  "GET /api/repayment-plans/": {
    "success": true,
    "code": "REPAYMENT_PLAN_LIST_SUCCESS",
    "message": "상환 계획 정보를 조회했습니다.",
    "data": {
      "plans": [
        {
          "loan_id": 1,
          "mode": "EXTRA_AMOUNT",
          "preference": null,
          "target_date": null,
          "extra_monthly_payment": 100000,
          "monthly_amount": 380000,
          "estimated_payoff_date": "2028-04-25",
          "estimated_total_interest": 272250,
          "effective_date": "2026-11-25",
          "target_payoff_date": "2028-04-25",
          "projected_payoff_date": "2028-04-25",
          "repayment_category": "INSTALLMENT",
          "planned_progress_pct": 0,
          "actual_progress_pct": 0,
          "planned_extra_amount": 100000,
          "actual_extra_amount": 0,
          "extra_gap_amount": -100000,
          "payoff_delay_months": 0,
          "track": {
            "status": "ON_TRACK",
            "data_status": "SUFFICIENT",
            "regular_due_status": "UPCOMING"
          },
          "cumulative_planned_extra_amount": 0,
          "cumulative_actual_extra_amount": 0,
          "cumulative_extra_gap_amount": 0,
          "priority": null,
          "d_day": 526,
          "estimated_total_fee": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "cumulative_planned_saving_amount": 0,
          "cumulative_actual_saving_amount": 0,
          "saving_gap_amount": null,
          "saving_progress_pct": null,
          "projection_source": "FALLBACK_PLAN",
          "observed_month_count": 0,
          "plan_start_principal": 6000000,
          "regular_due_status": "UPCOMING",
          "extra_achievement_pct": null,
          "affordability_gap_amount": 0,
          "warnings": []
        }
      ],
      "aggregate": {
        "remaining_principal": 6000000,
        "monthly_basic_amount": 280000,
        "monthly_extra_amount": 100000,
        "monthly_total_amount": 380000,
        "estimated_payoff_date": "2028-04-25",
        "estimated_total_interest": 272250,
        "target_payoff_date": "2028-04-25",
        "projected_payoff_date": "2028-04-25",
        "estimated_total_fee": null
      },
      "progress": {
        "paid_principal": 3000000,
        "progress_percent": 33.33,
        "target_progress_percent": null,
        "planned_paid_amount": null,
        "actual_paid_amount": null,
        "difference": null,
        "data_status": "INSUFFICIENT"
      },
      "scenarios": [
        {
          "mode": "MATURITY",
          "estimated_payoff_date": "2028-10-25",
          "estimated_total_interest": 375000,
          "estimated_total_fee": null
        }
      ],
      "overall_access": "SINGLE_LOAN",
      "strategy_code": "NONE",
      "overall_plan_exists": false,
      "data_revision": "rev-20261116-1"
    }
  },
  "GET /api/payments/": {
    "success": true,
    "code": "PAYMENT_LIST_SUCCESS",
    "message": "상환 내역 목록 정보를 조회했습니다.",
    "data": {
      "count": 1,
      "page": 1,
      "page_size": 20,
      "next_page": null,
      "previous_page": null,
      "results": [
        {
          "payment_id": 51,
          "loan_id": 1,
          "paid_at": "2026-11-25",
          "amount": 380000,
          "payment_type": "REGULAR",
          "due_item_id": 21,
          "principal_amount": 250000,
          "interest_amount": 30000,
          "extra_amount": 100000,
          "created_at": "2026-11-25T10:00:00+09:00",
          "fee_amount": 0,
          "savings_used_amount": 0,
          "editable": true,
          "delay_days": 0,
          "due_allocations": [
            {
              "due_item_id": 21,
              "required_paid_amount": 280000,
              "delay_days": 0
            }
          ]
        }
      ],
      "totals": {
        "amount": 380000,
        "principal_amount": 250000,
        "interest_amount": 30000,
        "extra_amount": 100000,
        "fee_amount": 0,
        "savings_used_amount": 0
      }
    }
  },
  "GET /api/reports/{report_id}/": {
    "success": true,
    "code": "REPORT_DETAIL_SUCCESS",
    "message": "상환 리포트 결과·상태 정보를 조회했습니다.",
    "data": {
      "report_id": 101,
      "status": "COMPLETED",
      "generated_at": "2026-11-15T09:00:00+09:00",
      "stale": false,
      "summary": "현재 계획 기준 예상 완납일은 2028년 4월입니다.",
      "pace_analysis": {
        "monthly_principal_repayment_rate": null,
        "principal_repaid_last_6_months": null,
        "data_status": "INSUFFICIENT",
        "principal_reduction_pct_6m": null,
        "observed_month_count": 0,
        "savings_deposited_6m": null,
        "savings_used_6m": null
      },
      "comparison": {
        "status": "INSUFFICIENT",
        "source_type": "DEMO",
        "age_group": "AGE_20S",
        "income_decile": 3,
        "extra_payment_count_6m": null,
        "peer_extra_payment_count_6m": 3,
        "disclaimer": "또래 수치는 가상 예시이며 실제 통계가 아닙니다.",
        "metric_type": "DEBT_SERVICE_RATIO",
        "monthly_debt_service_ratio_pct": null,
        "peer_monthly_debt_service_ratio_pct": 25
      },
      "payoff_scenarios": [
        {
          "type": "CURRENT",
          "level": "HIGH",
          "estimated_payoff_date": "2028-04-25"
        },
        {
          "type": "RATE_UP",
          "level": "HIGH",
          "estimated_payoff_date": "2028-04-25"
        },
        {
          "type": "INCOME_DOWN",
          "level": "HIGH",
          "estimated_payoff_date": "2028-04-25"
        },
        {
          "type": "EXPENSE_UP",
          "level": "MEDIUM",
          "estimated_payoff_date": "2028-05-25"
        }
      ],
      "suggestions": [
        {
          "type": "PLAN_REVIEW",
          "title": "상환 계획 확인",
          "description": "현재 계획을 검토해 보세요.",
          "action": "REPAYMENT_PLAN"
        }
      ],
      "error": null,
      "updated_at": "2026-11-15T09:00:00+09:00",
      "strategy_available": true,
      "strategy_type": "SINGLE_PREFERENCE"
    }
  },
  "GET /api/reports/strategy/": {
    "success": true,
    "code": "REPORT_STRATEGY_SUCCESS",
    "message": "상환 전략 정보를 조회했습니다.",
    "data": {
      "strategy_available": true,
      "unavailable_reason": null,
      "report_id": 101,
      "strategy_version": "strategy-v3-demo",
      "current_strategy": {
        "strategy_code": "NONE",
        "applied_at": null,
        "adherence_rate_3m": null,
        "judgement": "FIRST"
      },
      "situation": {
        "monthly_extra_budget": 100000,
        "projected_payoff_date": "2028-10-25",
        "estimated_total_interest": 900000,
        "discretionary_limit_usage_pct": 97.5,
        "surplus_ratio_pct": 3.4,
        "consecutive_extra_on_track_months": 3,
        "missed_payment_count_6m": 0,
        "variable_rate_exposure_pct": 88,
        "basic_at_risk_from": 0.97,
        "estimated_total_fee": null,
        "required_monthly_saving": 0,
        "recurring_capacity": 100000
      },
      "recommendation": {
        "strategy_code": "RATE_RISK",
        "type": "NEW",
        "reason": "+1%p 상승 시 현재 추가 상환계획 유지가 어려워 변동금리 노출을 먼저 줄입니다."
      },
      "candidates": [
        {
          "strategy_code": "RATE_RISK",
          "label": "금리 위험 대비",
          "advantages": [
            "변동금리 대출 노출을 빠르게 줄여요."
          ],
          "disadvantages": [
            "고정 고금리 대출의 이자 절감은 늦어질 수 있어요."
          ],
          "projected_payoff_date": "2028-08-25",
          "estimated_total_interest": 780000,
          "interest_saving": 120000,
          "monthly_burden": 480000,
          "allocations": [
            {
              "loan_id": 2,
              "amount": 100000,
              "priority": 1,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            },
            {
              "loan_id": 1,
              "amount": 0,
              "priority": 2,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            }
          ],
          "reason": "변동금리 노출을 먼저 줄여요.",
          "estimated_total_fee": null,
          "net_saving": null,
          "fee_comparison_basis": "GROSS_INTEREST"
        },
        {
          "strategy_code": "INTEREST_SAVING",
          "label": "이자 절감",
          "advantages": [
            "높은 이율의 원금을 먼저 줄여요."
          ],
          "disadvantages": [
            "변동금리 변동 위험이 오래 남을 수 있어요."
          ],
          "projected_payoff_date": "2028-07-25",
          "estimated_total_interest": 750000,
          "interest_saving": 150000,
          "monthly_burden": 480000,
          "allocations": [
            {
              "loan_id": 1,
              "amount": 100000,
              "priority": 1,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            },
            {
              "loan_id": 2,
              "amount": 0,
              "priority": 2,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            }
          ],
          "reason": "높은 금리부터 갚아 예상 이자를 줄여요.",
          "estimated_total_fee": null,
          "net_saving": null,
          "fee_comparison_basis": "GROSS_INTEREST"
        },
        {
          "strategy_code": "PARALLEL",
          "label": "병행",
          "advantages": [
            "여러 대출의 잔액을 동시에 줄여요."
          ],
          "disadvantages": [
            "가장 높은 금리 대출을 먼저 줄이는 것보다 이자가 클 수 있어요."
          ],
          "projected_payoff_date": "2028-09-25",
          "estimated_total_interest": 810000,
          "interest_saving": 90000,
          "monthly_burden": 480000,
          "allocations": [
            {
              "loan_id": 1,
              "amount": 60000,
              "priority": 1,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            },
            {
              "loan_id": 2,
              "amount": 40000,
              "priority": 1,
              "allocation_type": "EXTRA_PAYMENT",
              "actual_amount": 0
            }
          ],
          "reason": "여러 대출에 금액을 분산해 갚아요.",
          "estimated_total_fee": null,
          "net_saving": null,
          "fee_comparison_basis": "GROSS_INTEREST"
        }
      ],
      "stale": false,
      "strategy_type": "MULTI",
      "data_revision": "rev-20261116-1",
      "fee_comparison_basis": "GROSS_INTEREST"
    }
  },
  "POST /api/repayment-savings/": {
    "success": true,
    "code": "SAVING_CREATE_SUCCESS",
    "message": "상환자금 적립 기록 성공",
    "data": {
      "saving": {
        "saving_id": 61,
        "loan_id": 2,
        "saved_at": "2026-11-15",
        "amount": 100000,
        "editable": true,
        "created_at": "2026-11-15T10:00:00+09:00"
      },
      "loan_id": 2,
      "savings_balance": 100000,
      "required_monthly_saving": 112500,
      "planned_saving_amount": 120000,
      "actual_saving_amount": 100000,
      "saving_progress_pct": 10,
      "remaining_principal": 1000000,
      "report_stale": true
    }
  },
  "DELETE /api/repayment-savings/{saving_id}/": {
    "success": true,
    "code": "SAVING_DELETE_SUCCESS",
    "message": "상환자금 적립 기록 삭제 성공",
    "data": {
      "saving_id": 61,
      "deleted": true,
      "loan_id": 2,
      "savings_balance": 0,
      "required_monthly_saving": 125000,
      "planned_saving_amount": 120000,
      "actual_saving_amount": 0,
      "saving_progress_pct": 0,
      "remaining_principal": 1000000,
      "report_stale": true
    }
  },
  "PATCH /api/repayment-savings/{saving_id}/": {
    "success": true,
    "code": "SAVING_UPDATE_SUCCESS",
    "message": "상환자금 적립 기록 수정 성공",
    "data": {
      "saving": {
        "saving_id": 61,
        "loan_id": 2,
        "saved_at": "2026-11-15",
        "amount": 120000,
        "editable": true,
        "created_at": "2026-11-15T10:00:00+09:00"
      },
      "loan_id": 2,
      "savings_balance": 120000,
      "required_monthly_saving": 110000,
      "planned_saving_amount": 120000,
      "actual_saving_amount": 120000,
      "saving_progress_pct": 12,
      "remaining_principal": 1000000,
      "report_stale": true
    }
  },
  "GET /api/repayment-savings/": {
    "success": true,
    "code": "SAVING_LIST_SUCCESS",
    "message": "상환자금 적립 내역 조회 성공",
    "data": {
      "loan_id": 2,
      "savings_balance": 100000,
      "required_monthly_saving": 112500,
      "planned_saving_amount": 120000,
      "actual_saving_amount": 100000,
      "saving_progress_pct": 10,
      "remaining_principal": 1000000,
      "results": [
        {
          "saving_id": 61,
          "loan_id": 2,
          "saved_at": "2026-11-15",
          "amount": 100000,
          "editable": true,
          "created_at": "2026-11-15T10:00:00+09:00"
        }
      ]
    }
  },
  "PATCH /api/settings/notifications/": {
    "success": true,
    "code": "NOTIFICATION_SETTINGS_UPDATE_SUCCESS",
    "message": "알림 설정을 저장했습니다.",
    "data": {
      "payment_due": true,
      "report_update": true,
      "rate_reset": true,
      "grace_end": false
    }
  },
  "GET /api/settings/notifications/": {
    "success": true,
    "code": "NOTIFICATION_SETTINGS_SUCCESS",
    "message": "알림 설정 정보를 조회했습니다.",
    "data": {
      "payment_due": true,
      "report_update": true,
      "rate_reset": true,
      "grace_end": true
    }
  },
  "PUT /api/budgets/{year_month}/allocation/": {
    "success": true,
    "code": "BUDGET_ALLOCATION_SUCCESS",
    "message": "여유자금 배분을 저장했습니다.",
    "data": {
      "year_month": "2026-11",
      "available_cash": 740000,
      "allocation": {
        "allocations": [
          {
            "loan_id": 1,
            "amount": 100000,
            "allocation_type": "EXTRA_PAYMENT",
            "actual_amount": 0
          }
        ],
        "reserve_amount": 640000,
        "total_allocated": 740000,
        "unallocated_amount": 0
      },
      "updated_plans": [
        {
          "loan_id": 1,
          "mode": "EXTRA_AMOUNT",
          "preference": null,
          "target_date": null,
          "extra_monthly_payment": 100000,
          "monthly_amount": 380000,
          "estimated_payoff_date": "2028-04-25",
          "estimated_total_interest": 272250,
          "effective_date": "2026-11-25",
          "target_payoff_date": "2028-04-25",
          "projected_payoff_date": "2028-04-25",
          "repayment_category": "INSTALLMENT",
          "planned_progress_pct": 0,
          "actual_progress_pct": 0,
          "planned_extra_amount": 100000,
          "actual_extra_amount": 0,
          "extra_gap_amount": -100000,
          "payoff_delay_months": 0,
          "track": {
            "status": "ON_TRACK",
            "data_status": "SUFFICIENT",
            "regular_due_status": "UPCOMING"
          },
          "cumulative_planned_extra_amount": 0,
          "cumulative_actual_extra_amount": 0,
          "cumulative_extra_gap_amount": 0,
          "priority": null,
          "d_day": 526,
          "estimated_total_fee": null,
          "savings_balance": 0,
          "required_monthly_saving": 0,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0,
          "cumulative_planned_saving_amount": 0,
          "cumulative_actual_saving_amount": 0,
          "saving_gap_amount": null,
          "saving_progress_pct": null,
          "projection_source": "FALLBACK_PLAN",
          "observed_month_count": 0,
          "plan_start_principal": 6000000,
          "regular_due_status": "UPCOMING",
          "extra_achievement_pct": null,
          "affordability_gap_amount": 0,
          "warnings": []
        }
      ],
      "strategy_code": "NONE",
      "overall_plan_exists": false,
      "carry_in": 0,
      "allocation_capacity": 740000,
      "recurring_capacity": 740000,
      "deficit_amount": 0,
      "remaining_allocation_capacity": 740000,
      "settlement_status": "OPEN",
      "carry_out": null,
      "reserve_settled": null,
      "actual_income": null,
      "income_status": "FORECAST",
      "arrears_amount": 0,
      "actual_cash_repayment": 0,
      "actual_repayment_savings": 0,
      "discretionary_limit_amount": 800000,
      "actual_discretionary_expenses": null,
      "discretionary_savings_amount": null,
      "monthly_override_only": true
    }
  },
  "POST /api/onboarding/complete/": {
    "success": true,
    "code": "ONBOARDING_COMPLETE_SUCCESS",
    "message": "온보딩을 완료했습니다.",
    "data": {
      "completed": true,
      "dashboard_ready": true
    }
  },
  "GET /api/onboarding/": {
    "success": true,
    "code": "ONBOARDING_DETAIL_SUCCESS",
    "message": "온보딩 진행 정보를 조회했습니다.",
    "data": {
      "completed": false,
      "registered_loan_ids": [
        1
      ],
      "finance_profile_exists": true,
      "goals_configured": false,
      "next_step": "REPAYMENT_GOAL"
    }
  },
  "GET /api/settings/subscription/": {
    "success": true,
    "code": "SUBSCRIPTION_DETAIL_SUCCESS",
    "message": "요금제 정보 정보를 조회했습니다.",
    "data": {
      "plan_type": "PRO",
      "pro_features": [
        "RISK_ANALYSIS",
        "AI_REPORT",
        "OVERALL_STRATEGY_PLAN"
      ],
      "billing_enabled": false,
      "free_features": [
        "LOANS",
        "INDIVIDUAL_PLANS",
        "BUDGETS",
        "PAYMENTS",
        "DASHBOARD"
      ]
    }
  },
  "GET /api/payments/schedule/": {
    "success": true,
    "code": "PAYMENT_SCHEDULE_SUCCESS",
    "message": "월별 상환 일정 및 납부 상태 정보를 조회했습니다.",
    "data": {
      "month": "2026-11",
      "due_items": [
        {
          "due_item_id": 21,
          "loan_id": 1,
          "due_date": "2026-11-25",
          "required_amount": 280000,
          "planned_extra_amount": 100000,
          "paid_required_amount": 0,
          "paid_extra_amount": 0,
          "outstanding_amount": 280000,
          "status": "UPCOMING",
          "product_name": "예시 신용대출",
          "total_planned_amount": 380000,
          "display_status": "UPCOMING",
          "remaining_extra_amount": 100000,
          "unpaid_confirmed": false,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0
        }
      ],
      "calendar_events": [
        {
          "date": "2026-11-25",
          "type": "REGULAR_DUE",
          "loan_id": 1,
          "due_item_id": 21,
          "amount": 280000
        }
      ],
      "monthly_totals": {
        "scheduled_repayment": 280000,
        "actual_repayment": 0,
        "remaining_required_amount": 280000,
        "planned_extra_amount": 100000,
        "actual_extra_amount": 0,
        "completed_count": 0,
        "total_count": 1,
        "remaining_amount": 280000,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0
      }
    }
  },
  "POST /api/income-entries/": {
    "success": true,
    "code": "INCOME_ENTRY_CREATE_SUCCESS",
    "message": "소득 입금 기록을 저장했습니다.",
    "data": {
      "entry": {
        "income_entry_id": 31,
        "entry_type": "EXTRA",
        "received_date": "2026-11-15",
        "amount": 200000
      },
      "year_month": "2026-11",
      "monthly_income": 3700000,
      "planning_monthly_income": 3700000,
      "available_cash": 940000,
      "actual_available_cash": null,
      "allocation_needs_review": true,
      "carry_in": 0,
      "allocation_capacity": 940000,
      "recurring_capacity": 940000,
      "deficit_amount": 0,
      "remaining_allocation_capacity": 940000,
      "settlement_status": "OPEN",
      "carry_out": null,
      "reserve_settled": null,
      "actual_income": null,
      "income_status": "FORECAST",
      "arrears_amount": 0,
      "actual_cash_repayment": 0,
      "actual_repayment_savings": 0,
      "discretionary_limit_amount": 800000,
      "actual_discretionary_expenses": null,
      "discretionary_savings_amount": null
    }
  },
  "GET /api/budgets/{year_month}/": {
    "success": true,
    "code": "MONTHLY_BUDGET_DETAIL_SUCCESS",
    "message": "월별 예산·재정정보 정보를 조회했습니다.",
    "data": {
      "year_month": "2026-11",
      "monthly_income": 3700000,
      "income_type": "REGULAR",
      "payday": 25,
      "essential_expenses": 1200000,
      "discretionary_expenses": 780000,
      "savings": 500000,
      "emergency_fund": 1000000,
      "scheduled_repayment": 280000,
      "actual_repayment": 0,
      "available_cash": 940000,
      "allocation": {
        "allocations": [
          {
            "loan_id": 1,
            "amount": 100000,
            "allocation_type": "EXTRA_PAYMENT",
            "actual_amount": 0
          }
        ],
        "reserve_amount": 640000,
        "total_allocated": 740000,
        "unallocated_amount": 200000
      },
      "data_status": "ENTERED",
      "updated_at": "2026-11-15T09:00:00+09:00",
      "fixed_essential_expenses": 800000,
      "variable_essential_expenses": 400000,
      "source": "INPUT",
      "planning_monthly_income": 3700000,
      "actual_available_cash": null,
      "base_income": 3500000,
      "income_entries": [
        {
          "income_entry_id": 31,
          "entry_type": "EXTRA",
          "received_date": "2026-11-15",
          "amount": 200000
        }
      ],
      "allocation_needs_review": false,
      "carry_in": 0,
      "allocation_capacity": 940000,
      "recurring_capacity": 940000,
      "deficit_amount": 0,
      "remaining_allocation_capacity": 940000,
      "settlement_status": "OPEN",
      "carry_out": null,
      "reserve_settled": null,
      "actual_income": 200000,
      "income_status": "FORECAST",
      "arrears_amount": 0,
      "actual_cash_repayment": 0,
      "actual_repayment_savings": 0,
      "discretionary_limit_amount": 800000,
      "actual_discretionary_expenses": 780000,
      "discretionary_savings_amount": 20000
    }
  },
  "PUT /api/budgets/{year_month}/": {
    "success": true,
    "code": "MONTHLY_BUDGET_SAVE_SUCCESS",
    "message": "월별 재정정보를 저장했습니다.",
    "data": {
      "year_month": "2026-11",
      "monthly_income": 3700000,
      "income_type": "REGULAR",
      "payday": 25,
      "essential_expenses": 1200000,
      "discretionary_expenses": 780000,
      "savings": 500000,
      "emergency_fund": 1000000,
      "scheduled_repayment": 280000,
      "actual_repayment": 0,
      "available_cash": 940000,
      "allocation": {
        "allocations": [
          {
            "loan_id": 1,
            "amount": 100000,
            "allocation_type": "EXTRA_PAYMENT",
            "actual_amount": 0
          }
        ],
        "reserve_amount": 640000,
        "total_allocated": 740000,
        "unallocated_amount": 200000
      },
      "data_status": "ENTERED",
      "updated_at": "2026-11-15T09:00:00+09:00",
      "fixed_essential_expenses": 800000,
      "variable_essential_expenses": 400000,
      "source": "INPUT",
      "planning_monthly_income": 3700000,
      "actual_available_cash": null,
      "base_income": 3500000,
      "income_entries": [
        {
          "income_entry_id": 31,
          "entry_type": "EXTRA",
          "received_date": "2026-11-15",
          "amount": 200000
        }
      ],
      "allocation_needs_review": false,
      "carry_in": 0,
      "allocation_capacity": 940000,
      "recurring_capacity": 940000,
      "deficit_amount": 0,
      "remaining_allocation_capacity": 940000,
      "settlement_status": "OPEN",
      "carry_out": null,
      "reserve_settled": null,
      "actual_income": 200000,
      "income_status": "FORECAST",
      "arrears_amount": 0,
      "actual_cash_repayment": 0,
      "actual_repayment_savings": 0,
      "discretionary_limit_amount": 800000,
      "actual_discretionary_expenses": 780000,
      "discretionary_savings_amount": 20000
    }
  },
  "GET /api/loan-products/": {
    "success": true,
    "code": "LOAN_PRODUCT_LIST_SUCCESS",
    "message": "은행별 대출상품 목록 정보를 조회했습니다.",
    "data": {
      "products": [
        {
          "product_id": 11,
          "institution_id": 1,
          "name": "예시 신용대출",
          "loan_type": "CREDIT",
          "repayment_methods": [
            "EQUAL_PRINCIPAL",
            "EQUAL_PAYMENT"
          ],
          "source": "CATALOG"
        }
      ]
    }
  },
  "GET /api/risks/": {
    "success": true,
    "code": "RISK_DETAIL_SUCCESS",
    "message": "재정 위험 분석 정보를 조회했습니다.",
    "data": {
      "level": "STABLE",
      "indicators": {
        "surplus_ratio_percent": 21.14,
        "debt_service_ratio_percent": 8,
        "available_cash": 740000,
        "variable_rate_exposure": 0,
        "discretionary_expenses": 780000,
        "discretionary_limit_amount": 800000,
        "discretionary_limit_usage_pct": 97.5
      },
      "upcoming_events": [
        {
          "type": "MATURITY",
          "loan_id": 2,
          "event_date": "2026-12-01",
          "days_until": 15,
          "d_day": 15,
          "is_imminent": true
        }
      ],
      "history": [
        {
          "event_date": "2026-10-31",
          "type": "BUDGET_CHANGE",
          "level": "CAUTION",
          "description": "월별 재정정보 변동으로 여유자금 비율이 감소했습니다."
        }
      ],
      "data_status": "SUFFICIENT",
      "checks": [
        {
          "code": "SURPLUS_RATIO",
          "label": "여유자금 비율",
          "ratio_pct": 21.14,
          "level": "STABLE",
          "weight": 40,
          "points": 0
        },
        {
          "code": "DISCRETIONARY_LIMIT",
          "label": "선택 지출 한도",
          "ratio_pct": 97.5,
          "level": "CAUTION",
          "weight": 15,
          "points": 50
        },
        {
          "code": "VARIABLE_EXPOSURE",
          "label": "변동금리 노출",
          "ratio_pct": 0,
          "level": "STABLE",
          "weight": 15,
          "points": 0
        },
        {
          "code": "BASIC_DEBT_SERVICE",
          "label": "소득 대비 기본 상환",
          "ratio_pct": 8,
          "level": "STABLE",
          "weight": 30,
          "points": 0
        }
      ],
      "rate_thresholds": {
        "reduce_extra_from": null,
        "basic_at_risk_from": null
      },
      "six_month_changes": [
        {
          "year_month": "2026-10",
          "direction": "INCREASE",
          "reason": "EXPENSE",
          "amount_delta": 20000,
          "event_date": "2026-10-31",
          "change_value": 1.3,
          "change_unit": "PCT"
        }
      ],
      "strategy_link_available": true,
      "six_month_summary": {
        "net_monthly_burden_delta": 20000,
        "rate_change_count": 0,
        "income_change_count": 0,
        "expense_change_count": 1
      },
      "income_thresholds": {
        "reduce_extra_from": 18.29,
        "basic_at_risk_from": 21.15
      },
      "expense_thresholds": {
        "reduce_extra_from": 640001,
        "basic_at_risk_from": 740001
      },
      "score": 7.5,
      "emergency_coverage_months": null,
      "emergency_coverage_status": "NOT_NEEDED",
      "one_time_shortfall": 0
    }
  },
  "GET /api/plans/overall/": {
    "success": true,
    "code": "OVERALL_PLAN_SUCCESS",
    "message": "전체 상환 계획을 조회했습니다.",
    "data": {
      "state": "AVAILABLE",
      "strategy_code": "INTEREST_SAVING",
      "applied_at": "2026-11-15T09:00:00+09:00",
      "target_payoff_date": "2028-07-25",
      "projected_payoff_date": "2028-07-25",
      "remaining_principal": 9000000,
      "monthly_basic_amount": 380000,
      "monthly_extra_amount": 100000,
      "monthly_total_amount": 480000,
      "estimated_total_interest": 750000,
      "allocations": [
        {
          "loan_id": 1,
          "product_name": "예시 신용대출",
          "amount": 100000,
          "priority": 1,
          "target_payoff_date": "2028-04-25",
          "projected_payoff_date": "2028-04-25",
          "allocation_type": "EXTRA_PAYMENT",
          "actual_amount": 0
        },
        {
          "loan_id": 2,
          "product_name": "예시 대출",
          "amount": 0,
          "priority": 2,
          "target_payoff_date": "2028-07-25",
          "projected_payoff_date": "2028-07-25",
          "allocation_type": "EXTRA_PAYMENT",
          "actual_amount": 0
        }
      ],
      "needs_review": false,
      "estimated_total_fee": null,
      "data_revision": "rev-20261116-1",
      "monthly_saving_amount": 0
    }
  },
  "PATCH /api/payments/schedule/{due_item_id}/confirmation/": {
    "success": true,
    "code": "DUE_CONFIRMATION_SUCCESS",
    "message": "정기 납부 미납 여부 확인 성공",
    "data": {
      "due_item_id": 21,
      "loan_id": 1,
      "due_date": "2026-11-10",
      "required_amount": 280000,
      "paid_required_amount": 0,
      "outstanding_amount": 280000,
      "unpaid_confirmed": true,
      "status": "UNPAID",
      "display_status": "UNPAID",
      "report_stale": true
    }
  },
  "GET /api/reports/latest/": {
    "success": true,
    "code": "REPORT_LATEST_SUCCESS",
    "message": "최신 상환 리포트 정보를 조회했습니다.",
    "data": {
      "report_id": 101,
      "status": "COMPLETED",
      "generated_at": "2026-11-15T09:00:00+09:00",
      "stale": false,
      "report": {
        "report_id": 101,
        "status": "COMPLETED",
        "generated_at": "2026-11-15T09:00:00+09:00",
        "stale": false,
        "summary": "현재 계획 기준 예상 완납일은 2028년 4월입니다.",
        "pace_analysis": {
          "monthly_principal_repayment_rate": null,
          "principal_repaid_last_6_months": null,
          "data_status": "INSUFFICIENT",
          "principal_reduction_pct_6m": null,
          "observed_month_count": 0,
          "savings_deposited_6m": null,
          "savings_used_6m": null
        },
        "comparison": {
          "status": "INSUFFICIENT",
          "source_type": "DEMO",
          "age_group": "AGE_20S",
          "income_decile": 3,
          "extra_payment_count_6m": null,
          "peer_extra_payment_count_6m": 3,
          "disclaimer": "또래 수치는 가상 예시이며 실제 통계가 아닙니다.",
          "metric_type": "DEBT_SERVICE_RATIO",
          "monthly_debt_service_ratio_pct": null,
          "peer_monthly_debt_service_ratio_pct": 25
        },
        "payoff_scenarios": [
          {
            "type": "CURRENT",
            "level": "HIGH",
            "estimated_payoff_date": "2028-04-25"
          },
          {
            "type": "RATE_UP",
            "level": "HIGH",
            "estimated_payoff_date": "2028-04-25"
          },
          {
            "type": "INCOME_DOWN",
            "level": "HIGH",
            "estimated_payoff_date": "2028-04-25"
          },
          {
            "type": "EXPENSE_UP",
            "level": "MEDIUM",
            "estimated_payoff_date": "2028-05-25"
          }
        ],
        "suggestions": [
          {
            "type": "PLAN_REVIEW",
            "title": "상환 계획 확인",
            "description": "현재 계획을 검토해 보세요.",
            "action": "REPAYMENT_PLAN"
          }
        ],
        "error": null,
        "updated_at": "2026-11-15T09:00:00+09:00",
        "strategy_available": true,
        "strategy_type": "SINGLE_PREFERENCE"
      },
      "updated_at": "2026-11-15T09:00:00+09:00"
    }
  },
  "GET /api/dashboard/": {
    "success": true,
    "code": "DASHBOARD_DETAIL_SUCCESS",
    "message": "홈 종합 현황 정보를 조회했습니다.",
    "data": {
      "plan_type": "PRO",
      "selected_loan_id": null,
      "loans": [
        {
          "loan_id": 1,
          "product_name": "예시 신용대출",
          "remaining_principal": 6000000,
          "paid_principal": 3000000,
          "progress_percent": 33.33,
          "savings_balance": 0,
          "status": "ACTIVE",
          "required_monthly_saving": 0
        }
      ],
      "total_remaining_principal": 6000000,
      "overall_progress_percent": 33.33,
      "estimated_payoff_date": "2028-04-25",
      "next_payment": {
        "due_item_id": 21,
        "loan_id": 1,
        "due_date": "2026-11-25",
        "required_amount": 280000,
        "planned_extra_amount": 100000,
        "paid_required_amount": 0,
        "paid_extra_amount": 0,
        "outstanding_amount": 280000,
        "status": "UPCOMING",
        "product_name": "예시 신용대출",
        "total_planned_amount": 380000,
        "display_status": "UPCOMING",
        "remaining_extra_amount": 100000,
        "unpaid_confirmed": false,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0
      },
      "monthly_summary": {
        "scheduled_repayment": 280000,
        "actual_repayment": 0,
        "remaining_required_amount": 280000,
        "planned_extra_amount": 100000,
        "actual_extra_amount": 0,
        "completed_count": 0,
        "total_count": 1,
        "remaining_amount": 280000,
        "planned_saving_amount": 0,
        "actual_saving_amount": 0
      },
      "risk_summary": {
        "level": "STABLE",
        "available_cash": 740000,
        "locked": false,
        "score": 7.5
      },
      "report_status": {
        "status": "COMPLETED",
        "report_id": 101,
        "stale": false,
        "locked": false,
        "updated_at": "2026-11-16T08:00:00+09:00",
        "is_new": true
      },
      "monthly_checklist": [
        {
          "due_item_id": 21,
          "loan_id": 1,
          "due_date": "2026-11-25",
          "required_amount": 280000,
          "planned_extra_amount": 100000,
          "paid_required_amount": 0,
          "paid_extra_amount": 0,
          "outstanding_amount": 280000,
          "status": "UPCOMING",
          "product_name": "예시 신용대출",
          "total_planned_amount": 380000,
          "display_status": "UPCOMING",
          "remaining_extra_amount": 100000,
          "unpaid_confirmed": false,
          "planned_saving_amount": 0,
          "actual_saving_amount": 0
        }
      ]
    }
  },
  "DELETE /api/users/me/": {
    "success": true,
    "code": "USER_DELETE_SUCCESS",
    "message": "회원 탈퇴를 완료했습니다.",
    "data": {
      "deleted": true
    }
  },
  "POST /api/auth/signup/": {
    "success": true,
    "code": "SIGNUP_SUCCESS",
    "message": "회원가입을 완료했습니다.",
    "data": {
      "user_id": 1,
      "email": "demo@example.com",
      "name": "민준"
    }
  }
}
