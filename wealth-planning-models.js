(function (root) {
  'use strict';

  function finite(values) {
    if (values.some(value => !Number.isFinite(value))) throw new RangeError('Enter finite numbers.');
  }

  function futureValue(principal, contribution, years, rate, beginningOfYear = false) {
    finite([principal, contribution, years, rate]);
    if (principal < 0 || contribution < 0 || years < 0 || !Number.isInteger(years) || rate <= -1) {
      throw new RangeError('Invalid planning inputs.');
    }
    const growth = Math.pow(1 + rate, years);
    const annuity = Math.abs(rate) < 1e-12 ? years : Math.expm1(years * Math.log1p(rate)) / rate;
    return principal * growth + contribution * annuity * (beginningOfYear ? 1 + rate : 1);
  }

  function fireYears(principal, contribution, target, rate) {
    finite([principal, contribution, target, rate]);
    if (principal < 0 || contribution < 0 || target < 0 || rate <= -1) throw new RangeError('Invalid FIRE inputs.');
    if (principal >= target) return 0;
    if (Math.abs(rate) < 1e-12) return contribution === 0 ? Infinity : Math.ceil((target - principal) / contribution - 1e-10);
    const numerator = contribution + rate * target;
    const denominator = contribution + rate * principal;
    // At or above the limiting balance under a negative return, the target is unreachable.
    if (numerator <= 0 || denominator <= 0) return Infinity;
    return Math.max(0, Math.ceil(Math.log(numerator / denominator) / Math.log1p(rate) - 1e-10));
  }

  function savingsRequired(principal, target, years, rate) {
    finite([principal, target, years, rate]);
    if (years <= 0 || rate <= -1) throw new RangeError('Invalid horizon.');
    const growth = Math.pow(1 + rate, years);
    const annuity = Math.abs(rate) < 1e-12 ? years : Math.expm1(years * Math.log1p(rate)) / rate;
    return Math.max(0, (target - principal * growth) / annuity);
  }

  function fundedMonths(principal, annualSpending, annualRealRate) {
    finite([principal, annualSpending, annualRealRate]);
    if (principal < 0 || annualSpending < 0 || annualRealRate <= -1) throw new RangeError('Invalid runway inputs.');
    if (annualSpending === 0) return Infinity;
    if (principal === 0) return 0;
    const withdrawal = annualSpending / 12;
    const rate = Math.expm1(Math.log1p(annualRealRate) / 12);
    if (Math.abs(rate) < 1e-12) return Math.floor(principal / withdrawal + 1e-9);
    if (rate > 0 && principal * rate >= withdrawal) return Infinity;
    return Math.max(0, Math.floor(-Math.log1p(-principal * rate / withdrawal) / Math.log1p(rate) + 1e-9));
  }

  function read(ids) {
    return ids.map(id => {
      const element = document.getElementById(id);
      if (element.value.trim() === '' || !element.reportValidity() || !Number.isFinite(Number(element.value))) {
        throw new RangeError('Correct the highlighted input.');
      }
      return Number(element.value);
    });
  }

  const api = { futureValue, fireYears, savingsRequired, fundedMonths, read };
  root.WealthPlanning = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
