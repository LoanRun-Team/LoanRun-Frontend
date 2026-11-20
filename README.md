
<div align="center">

<img width="1920" height="1080" alt="Slide 16_9 - 5" src="https://github.com/user-attachments/assets/007cc5c7-657c-41b3-961a-ac66495359bc" />


<br/>
<br/>

# LOAN RUN

**개인 재정 데이터 기반 대출 상환 관리 및 금융 위험 분석 서비스**

<br/>

[![Service](https://img.shields.io/badge/Service-LOAN_RUN-5898AB?style=flat-square)](https://dev.loanrun.shop/)
[![Frontend](https://img.shields.io/badge/Repository-Frontend-24292e?style=flat-square&logo=github)](https://github.com/LoanRun-Team/LoanRun-Frontend)
[![Backend](https://img.shields.io/badge/Repository-Backend-24292e?style=flat-square&logo=github)](https://github.com/LoanRun-Team/LoanRun-Backend)

</div>

<br/>







<br/>

## 01. Project Overview

LOAN RUN은 사용자의 대출 정보와 소득·지출 데이터를 기반으로 상환 계획을 수립하고, 잠재적인 금융 위험을 분석하는 개인 재정 관리 서비스입니다.

기존 금융 서비스가 대출 상품 비교 및 한도 조회에 집중한다면, LOAN RUN은 대출 실행 이후의 상환 과정과 재정 안정성 관리에 집중합니다.

사용자는 대출별 상환 현황을 통합적으로 관리하고, 자신의 재정 상황에 적합한 상환 전략을 수립하여 장기적인 금융 계획을 관리할 수 있습니다.

<br/>

## 02. Background

대출 상환 과정에서는 금리 변동, 소득 변화, 생활비 증가 등 다양한 재정적 변수가 발생합니다.

그러나 기존 대출 관리 방식만으로는 이러한 변수가 전체 상환 일정과 재정 상태에 미치는 영향을 파악하기 어렵습니다.

LOAN RUN은 다음과 같은 문제를 해결하고자 합니다.

| Problem | Solution |
| :--- | :--- |
| 분산된 대출 정보 및 상환 일정 | 복수 대출 통합 관리 |
| 장기적인 상환 계획 수립의 어려움 | 목표 및 예상 완납일 분석 |
| 추가 상환 우선순위 판단의 어려움 | 맞춤형 상환 전략 및 자금 배분 |
| 대출 상환 이후 생활 여력 파악의 어려움 | 소득·지출 기반 여유자금 산출 |
| 재정 상황 변화에 따른 불확실성 | 금융 위험 분석 및 대응 방안 제공 |

<br/>

## 03. Key Features

### 3.1 Dashboard

사용자의 대출 정보와 상환 현황을 통합적으로 제공합니다.

- 전체 잔여 대출 원금 및 상환 진행률
- 다음 상환 일정 및 납부 예정 금액
- 월별 상환 현황 및 상환 기록 시각화

<!-- 홈 화면 이미지 -->

### 3.2 Loan Management

대출별 상환 조건과 실제 납부 기록을 관리합니다.

- 복수 대출 등록 및 관리
- 상환 방식별 원금·이자 정보 제공
- 정기 납부 및 추가 상환 기록 관리
- 기간별 상환 내역 조회
- 잔여 이자 및 예상 완납일 확인

<!-- 대출 관리 화면 이미지 -->

### 3.3 Repayment Planning

사용자의 상환 목표와 실제 상환 데이터를 기반으로 개별 및 전체 상환 계획을 제공합니다.

- 목표 완납일 및 추가 상환 금액 설정
- 계획 대비 실제 상환 진행률 비교
- 만기일시상환 대출의 상환자금 적립 관리
- 대출별 추가 상환 우선순위 설정
- 전체 대출 완납 로드맵 시각화

<!-- 상환 계획 화면 이미지 -->

### 3.4 Budget Management

소득과 지출, 대출 상환액을 기반으로 실질적인 가용 자금을 관리합니다.

- 월별 소득 및 지출 관리
- 대출 상환 이후 여유자금 산출
- 추가 상환 및 만기 상환 적립 금액 배분
- 사용자 지정 자금 배분 관리

<!-- 예산·지출 화면 이미지 -->

### 3.5 Financial Risk Analysis

사용자의 대출 구조와 재정 데이터를 기반으로 잠재적인 위험 요인을 분석합니다.

- 재정 상태 및 상환 부담 분석
- 주요 금융 위험 요인 식별
- 금리 및 재정 상황 변화에 따른 위험 분석
- 위험 요인별 대응 방향 제공

<!-- 위험 분석 화면 이미지 -->

### 3.6 Repayment Report

분석된 재정 데이터를 기반으로 사용자에게 적합한 상환 전략을 제공하며, 선택한 전략을 실제 상환 계획에 반영합니다.

| Strategy | Description |
| :--- | :--- |
| 금리 위험 대비 | 변동금리 대출의 금리 상승 위험을 고려한 상환 |
| 이자 절약 | 전체 이자 비용을 줄이기 위한 상환 |
| 나눠 갚기 | 복수 대출에 추가 상환 가능 금액을 배분 |
| 직접 조정 | 사용자가 직접 추가 상환 금액을 설정 |
| 만기 상환 적립 | 만기일시상환 대출의 원금 상환자금 확보 |

<!-- 상환 리포트 화면 이미지 -->

<br/>

## 04. Service Flow

<p align="center">
  <img width="49%" alt="Service Flow 1" src="https://github.com/user-attachments/assets/2452144b-be8d-4d21-a90e-f50000351c12" />
  <img width="49%" alt="Service Flow 2" src="https://github.com/user-attachments/assets/566660d9-1f20-4db2-bb38-80322c5400a8" />
</p>

<br/>
```

사용자는 최초 온보딩을 통해 재정 정보를 설정하고 대출 정보를 등록합니다.

이후 실제 상환 기록과 소득·지출 데이터를 기반으로 재정 위험을 분석하며, 분석 결과에 따른 상환 전략을 실제 계획에 반영할 수 있습니다.

<br/>

## 05. Service Differentiation

| 구분 | 일반적인 대출 관리 | LOAN RUN |
| :--- | :--- | :--- |
| 서비스 범위 | 대출 조회 및 상품 비교 | 대출 실행 이후 상환 관리 |
| 분석 기준 | 대출 금액 및 금리 | 대출 정보, 소득, 지출, 상환 기록 |
| 상환 관리 | 현재 잔액 및 납부 일정 | 목표 완납일 및 예상 완납일 |
| 위험 분석 | 개별 금융 지표 중심 | 개인 재정 상태 기반 위험 분석 |
| 상환 전략 | 정보 및 지표 제공 | 전략 수립 및 실제 상환 계획 반영 |

<br/>

## 06. Repository

| Repository | Description |
| :--- | :--- |
| [Frontend](https://github.com/LoanRun-Team/LoanRun-Frontend) | 사용자 인터페이스 및 API 연동 |
| [Backend](https://github.com/LoanRun-Team/LoanRun-Backend) | 비즈니스 로직 및 REST API |

<br/>

## 07. Demo

- **Service:** https://dev.loanrun.shop/

<br/>




