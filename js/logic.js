
// 구독 데이터(subscription) 예시
//{
//  "id": "sub_1",
//  "name": "넷플릭스",
//  "amount": 13500,
//  "cycle": "monthly", //"monthly" 또는 "yearly"//  
//  "nextPaymentDate": "2024-06-15"
//  "category": "영상",
//}

//{
// "Id": "sub1"},

// "category": "영상", "음악", "운동", "생산성"
// "paymentMethod": 신한카드, 삼성카드, 현대카드, 카카오뱅크, 토스뱅크, 카카오페이, 네이버페이, 페이코, 쿠페이, 삼성페이, LG페이, 신한페이판, KB페이, 우리페이, 하나머니, SSG페이, 롯데멤버스, CJ ONE 등
//}

// convertToMonthlyAmount(subscription)
// 한 구독 항목을 월간 기준 금액으로 환산한다.
// yearly 결제 주기라면 연간 금액을 12개월로 나누어 월 평균 비용을 계산하고,
// monthly 결제 주기라면 입력된 금액 그대로 월 비용으로 취급한다.
// 매개변수 subscription은 { id, name, amount, cycle, nextPaymentDate, category, paymentMethod } 형태의 데이터 객체다.
// 반환값은 원래 데이터의 cycle에 따라 환산된 월 기준 금액 숫자다.
function convertToMonthlyAmount(subscription) {
    if (subscription.cycle === "yearly") {
        return Math.round(subscription.amount / 12);
    }
    return subscription.amount;
}

// calculateTotalMonthlyAmount(subscriptions)
// 구독 데이터 배열 전체를 순회하며 각 항목을 convertToMonthlyAmount()로 월 기준 금액으로 환산하고,
// 그 값을 누적한 총 월간 지출액을 구한다.
// 매개변수 subscriptions는 구독 데이터 객체들의 배열이다.
// 반환값은 각 구독 항목의 월간 환산 금액을 모두 더한 숫자다.
function calculateTotalMonthlyAmount(subscriptions) {
    let total = 0;
    for (const subscription of subscriptions) {
        total += convertToMonthlyAmount(subscription);
    }
    return total;
}

// calculateTotalYearlyAmount(subscriptions)
// 구독 목록의 총 월간 비용을 구한 뒤 그 값을 12개월로 곱해 연간 지출 총액을 계산한다.
// 매개변수 subscriptions는 구독 항목들의 배열이다.
// 반환값은 월간 비용 기준으로 환산한 전체 경비를 12배한 숫자다.
function calculateTotalYearlyAmount(subscriptions) {
    const totalMonthlyAmount = calculateTotalMonthlyAmount(subscriptions);
    return totalMonthlyAmount * 12;
}

// getDaysUntilPayment(today, nextPaymentDate)
// 오늘 날짜와 특정 구독의 다음 결제일을 비교해, 그 결제일까지 남은 일수를 계산한다.
// today와 nextPaymentDate는 모두 YYYY-MM-DD 형식의 문자열로 들어오고,
// 시간 정보는 제외한 순수 날짜 차이만 계산한다.
// 반환값은 오늘을 기준으로 결제일이 며칠 남았는지, 음수면 이미 지난 일수다.
function getDaysUntilPayment(today, nextPaymentDate) {
    const todayDate = new Date(today);
    const paymentDate = new Date(nextPaymentDate);
    const diffTime = paymentDate - todayDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}   

// filterUpcomingPayments(subscriptions, today, days)
// 오늘 기준으로 days일 안에 결제될 예정인 구독 항목만 골라서 반환한다.
// 예를 들어 days=7이면 7일 이내 결제 예정 구독만 보이고,
// 이미 결제일이 지났거나, 오늘 이후 days일보다 멀리 있는 구독은 제외한다.
// 반환값은 결제 예정 항목이 담긴 목록 배열이다.
function filterUpcomingPayments(subscriptions, today, days) {
    return subscriptions.filter(subscription => {
        const daysUntilPayment = getDaysUntilPayment(today, subscription.nextPaymentDate);
        return daysUntilPayment >= 0 && daysUntilPayment <= days;
    }); 
}

// groupByCategory(subscriptions)
// 구독 항목을 category 값을 기준으로 묶고, 각 카테고리별 월간 환산 금액 합계를 계산한다.
// 결과는 { "영상": 13500, "음악": 10900 } 같은 객체 형태로 반환된다.
// 이 함수는 차트나 카테고리별 소비 집계 UI를 만들기 위해 사용된다.
function groupByCategory(subscriptions) {
    const categoryTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = convertToMonthlyAmount(subscription);
        if (categoryTotals[subscription.category]) {
            categoryTotals[subscription.category] += monthlyAmount;
        } else {
            categoryTotals[subscription.category] = monthlyAmount;
        }
    }
    return categoryTotals;
}   

// groupByPaymentMethod(subscriptions)
// 구독 항목을 paymentMethod 값을 기준으로 묶어 각 결제 수단별 월간 지출 합계를 계산한다.
// 결과는 { "신한카드": 13500, "삼성카드": 10900 } 형식의 객체다.
// 카드별 지출 내역 또는 결제 수단별 그래프 렌더링에 활용된다.
function groupByPaymentMethod(subscriptions) {
    const paymentMethodTotals = {};
    for (const subscription of subscriptions) {
        const monthlyAmount = convertToMonthlyAmount(subscription);
        if (paymentMethodTotals[subscription.paymentMethod]) {
            paymentMethodTotals[subscription.paymentMethod] += monthlyAmount;
        } else {
            paymentMethodTotals[subscription.paymentMethod] = monthlyAmount;
        }
    }
    return paymentMethodTotals;
}

