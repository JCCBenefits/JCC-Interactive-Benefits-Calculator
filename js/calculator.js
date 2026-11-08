const PAY_PERIODS=24;
const MONTHS=12;
const planYearDate=new Date("2026-07-01T00:00:00");
const rates={
  medical:{
    none:{emp:{none:0,employee:0,dual:0,family:0},county:{none:0,employee:0,dual:0,family:0}},
    hsa:{emp:{none:0,employee:51,dual:145,family:190},county:{none:0,employee:695,dual:1344,family:1872}},
    traditional:{emp:{none:0,employee:140,dual:347,family:552},county:{none:0,employee:842,dual:1514,family:2057}}
  },
  dental:{
    none:{emp:{none:0,employee:0,dual:0,family:0},county:{none:0,employee:0,dual:0,family:0}},
    epo:{emp:{none:0,employee:6,dual:15,family:26},county:{none:0,employee:22,dual:38,family:58}},
    ppo1:{emp:{none:0,employee:2,dual:5,family:10},county:{none:0,employee:22,dual:38,family:58}},
    ppo2:{emp:{none:0,employee:12,dual:24,family:31},county:{none:0,employee:28,dual:47,family:71}}
  },
  vision:{none:0,employee:8.28,dual:15.32,family:23.56},
  critical:{
    non:{
      10000:{"18-29":3.5,"30-39":5,"40-49":9.6,"50-59":18.7,"60-69":33.2,"70+":58.2},
      20000:{"18-29":7,"30-39":10,"40-49":19.2,"50-59":37.4,"60-69":66.4,"70+":116.4}
    },
    tobacco:{
      10000:{"18-29":3.7,"30-39":6.1,"40-49":14.4,"50-59":34.3,"60-69":69.7,"70+":123.1},
      20000:{"18-29":7.4,"30-39":12.2,"40-49":28.8,"50-59":68.6,"60-69":139.4,"70+":246.2}
    }
  },
  std:{"<30":.81,"30-34":.90,"35-39":.65,"40-44":.56,"45-49":.66,"50-54":.74,"55-59":1.00,"60+":1.23},
  ltd:{"<25":.14,"25-29":.18,"30-34":.30,"35-39":.49,"40-44":.58,"45-49":.85,"50-54":.85,"55-59":.85,"60-64":.92,"65-69":1.04,"70+":1.07},
  life:{"34-":.05,"35-39":.06,"40-44":.08,"45-49":.12,"50-54":.20,"55-59":.31,"60-64":.54,"65-69":1.02,"70+":2.06},
  dcMatch:{0:0,.5:.5,1:1,1.5:1.25,2:1.5,2.5:1.75,3:2,3.5:2.25,4:2.5}
};
function el(id){return document.getElementById(id)}
function num(id){const n=parseFloat(el(id)?.value);return Number.isFinite(n)?n:0}
function val(id){return el(id)?.value||""}
function money(n){return (Number.isFinite(n)?n:0).toLocaleString("en-US",{style:"currency",currency:"USD"})}


function estimateFica(taxableWages) {

  // Automatically use the current calendar year's
  // Social Security taxable wage limit.
  const taxYear = new Date().getFullYear();

  const socialSecurityLimits = {
    2026: 184500,
    2027: 192300
  };

  const annualLimit = socialSecurityLimits[taxYear];

  // Do not estimate using an unverified future wage limit.
  if (annualLimit === undefined) return null;

  const roundCents = amount =>
    Math.round((amount + Number.EPSILON) * 100) / 100;

  // Estimated taxable wages for an average paycheck.
  const wages = roundCents(
    Math.max(0, Number(taxableWages) || 0)
  );

  // Project annual taxable earnings over 24 pay periods.
  const annualWages = wages * PAY_PERIODS;

  // Average Social Security tax per paycheck,
  // accounting for the annual wage limit.
  const socialSecurity = roundCents(
    Math.min(annualWages, annualLimit) *
    0.062 / PAY_PERIODS
  );

  // Medicare applies to all FICA-taxable earnings.
  const medicare = roundCents(
    annualWages * 0.0145 / PAY_PERIODS
  );

  // Estimated average Additional Medicare Tax.
  // Actual withholding begins after wages paid
  // by the employer exceed $200,000 in the year.
  const additionalMedicare = roundCents(
    Math.max(0, annualWages - 200000) *
    0.009 / PAY_PERIODS
  );

  return {
    employeeSocialSecurity: socialSecurity,
    employeeMedicare: medicare,
    employeeAdditionalMedicare: additionalMedicare,

    employeeFicaTotal: roundCents(
      socialSecurity + medicare + additionalMedicare
    ),

    countySocialSecurity: socialSecurity,
    countyMedicare: medicare,

    countyFicaTotal: roundCents(
      socialSecurity + medicare
    )
  };
}


function text(id,v){if(el(id))el(id).textContent=v}
function value(id,v){if(el(id))el(id).value=v}
function ageAsOf(dateString,asOf=planYearDate){
  if(!dateString)return null;
  const d=new Date(dateString+"T00:00:00");
  if(Number.isNaN(d.getTime()))return null;
  let age=asOf.getFullYear()-d.getFullYear();
  const before=asOf.getMonth()<d.getMonth()||(asOf.getMonth()===d.getMonth()&&asOf.getDate()<d.getDate());
  if(before)age--;
  return age>=0?age:null;
}
function getPay(){
  const mode=document.querySelector('input[name="payMode"]:checked')?.value||"salary";
  const hours=num("hoursWeek")||40;
  const annualHours=hours*52;
  let annual=mode==="salary"?num("annualSalary"):num("hourlyRate")*annualHours;
  let hourly=annualHours?annual/annualHours:0;
  if(mode==="salary")value("hourlyRate",hourly.toFixed(2)); else value("annualSalary",annual.toFixed(2));
  return {mode,annual,hourly,annualHours,gross:annual/PAY_PERIODS,monthly:annual/MONTHS,weekly:annual/52};
}
function selectedToggles(){return new Set([...document.querySelectorAll(".benefit-toggle:checked")].map(x=>x.value))}
function sectionOn(name){return selectedToggles().has(name)}
function monthlyToPay(x){return x/2}
function ciBand(age){if(age==null)return null;if(age<30)return"18-29";if(age<40)return"30-39";if(age<50)return"40-49";if(age<60)return"50-59";if(age<70)return"60-69";return"70+"}
function stdBand(age){if(age==null)return null;if(age<30)return"<30";if(age<35)return"30-34";if(age<40)return"35-39";if(age<45)return"40-44";if(age<50)return"45-49";if(age<55)return"50-54";if(age<60)return"55-59";return"60+"}
function ltdBand(age){if(age==null)return null;if(age<25)return"<25";if(age<30)return"25-29";if(age<35)return"30-34";if(age<40)return"35-39";if(age<45)return"40-44";if(age<50)return"45-49";if(age<55)return"50-54";if(age<60)return"55-59";if(age<65)return"60-64";if(age<70)return"65-69";return"70+"}
function lifeBand(age){if(age==null)return null;if(age<=34)return"34-";if(age<40)return"35-39";if(age<45)return"40-44";if(age<50)return"45-49";if(age<55)return"50-54";if(age<60)return"55-59";if(age<65)return"60-64";if(age<70)return"65-69";return"70+"}
function showPanel(id){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  el(id)?.classList.add("active");
  document.querySelector(`.tab[data-panel="${id}"]`)?.classList.add("active");
  if(el("mobileSection"))el("mobileSection").value=id;
  calculate();
}
function buildNav(){
  const s=el("mobileSection");s.innerHTML="";
  document.querySelectorAll(".tab").forEach(t=>{const o=document.createElement("option");o.value=t.dataset.panel;o.textContent=t.textContent.trim();s.appendChild(o)});
}
function benefitCosts(pay,age,spouseAge){
  const medPlan=val("medicalPlan"),medCov=val("medicalCoverage");
  const dentPlan=val("dentalPlan"),dentCov=val("dentalCoverage");
  const visCov=val("visionCoverage");
  const medMonthly=sectionOn("medical")?(rates.medical[medPlan]?.emp?.[medCov]||0):0;
  const medCountyMonthly=sectionOn("medical")?(rates.medical[medPlan]?.county?.[medCov]||0):0;
  const dentMonthly=sectionOn("dental")?(rates.dental[dentPlan]?.emp?.[dentCov]||0):0;
  const dentCountyMonthly=sectionOn("dental")?(rates.dental[dentPlan]?.county?.[dentCov]||0):0;
  const visionMonthly=sectionOn("vision")?(rates.vision[visCov]||0):0;

  const hsaEligible=sectionOn("accounts")&&medPlan==="hsa"&&medCov!=="none";
  const hsaEmp=hsaEligible?num("hsaEmployeePerPay"):0;
  const hsaBase=hsaEligible?43.34:0;
  const hsaMatch=hsaEligible?Math.min(hsaEmp*.5,30):0;
  const healthFsa=sectionOn("accounts")&&medPlan==="traditional"?Math.min(num("healthFsaAnnual"),3400)/PAY_PERIODS:0;
  const limitedFsa=sectionOn("accounts")&&medPlan==="hsa"?Math.min(num("limitedFsaAnnual"),3400)/PAY_PERIODS:0;
  const depFsa=sectionOn("accounts")?Math.min(num("dependentFsaAnnual"),7500)/PAY_PERIODS:0;

  let ciEmp=0,ciSpouse=0;
  if(sectionOn("critical")){
    const band=ciBand(age),status=val("tobacco"),empCov=Number(val("ciEmployeeCoverage"));
    if(band&&empCov)ciEmp=monthlyToPay(rates.critical[status][empCov][band]);
    let spouseCov=Number(val("ciSpouseCoverage"));
    if(spouseCov>empCov){spouseCov=empCov;value("ciSpouseCoverage",String(spouseCov))}
    if(val("coverSpouse")==="yes"&&band&&spouseCov)ciSpouse=monthlyToPay(rates.critical[status][spouseCov][band]);
  }

  let std=0,ltd=0;
  if(sectionOn("disability")&&age!=null){
    if(val("stdEnroll")==="yes")std=(pay.weekly*.60*rates.std[stdBand(age)]/10)/2;
    if(val("ltdEnroll")==="yes")ltd=(pay.monthly*rates.ltd[ltdBand(age)]/100)/2;
  }

  let lifeEmp=0,lifeSpouse=0,lifeChild=0,lifeEmpCov=0,lifeSpouseCov=0,lifeChildCov=0;
  const option=sectionOn("life")?Number(val("lifeOption")):0;
  if(option>0&&age!=null){
    lifeEmpCov=Math.min(pay.annual*option,975000);
    lifeEmp=(lifeEmpCov/1000*rates.life[lifeBand(age)])/2;
    const spouseMultiple=[0,.5,1,1.5,2,2,2,2,2][option];
    if(val("includeSpouseLife")==="yes"&&val("coverSpouse")==="yes"&&spouseAge!=null){
      lifeSpouseCov=Math.min(pay.annual*spouseMultiple,487500);
      lifeSpouse=(lifeSpouseCov/1000*rates.life[lifeBand(spouseAge)])/2;
    }
    const childMap=[0,10000,10000,20000,30000,30000,30000,30000,30000];
    const childMonthly=[0,.8,.8,1.6,2.4,2.4,2.4,2.4,2.4];
    if(val("includeChildLife")==="yes"){lifeChildCov=childMap[option];lifeChild=childMonthly[option]/2}
  }

  return {
    med:monthlyToPay(medMonthly),medCounty:monthlyToPay(medCountyMonthly),
    dent:monthlyToPay(dentMonthly),dentCounty:monthlyToPay(dentCountyMonthly),
    vision:monthlyToPay(visionMonthly),
    hsaEmp,hsaBase,hsaMatch,healthFsa,limitedFsa,depFsa,
    ciEmp,ciSpouse,std,ltd,lifeEmp,lifeSpouse,lifeChild,
    lifeEmpCov,lifeSpouseCov,lifeChildCov,
    total:monthlyToPay(medMonthly)+monthlyToPay(dentMonthly)+monthlyToPay(visionMonthly)+hsaEmp+healthFsa+limitedFsa+depFsa+ciEmp+ciSpouse+std+ltd+lifeEmp+lifeSpouse+lifeChild,
    county:monthlyToPay(medCountyMonthly)+monthlyToPay(dentCountyMonthly)+hsaBase+hsaMatch
  };
}
function retirementCosts(pay){
  const plan=val("retirementPlan");
  const mandatory=pay.gross*.05;

  let voluntary=0;
  let mandatoryCountyMatch=0;
  let voluntaryCountyMatch=0;

  if(plan==="hybrid"){
    const pct=num("dcPercent");

    voluntary=pay.gross*pct/100;

    // County mandatory match to the Hybrid 401(a)
    mandatoryCountyMatch=pay.gross*.01;

    // Additional County match based on the employee's voluntary 457(b) election
    voluntaryCountyMatch=pay.gross*(rates.dcMatch[pct]||0)/100;
  }

  // Empower Supplemental Defined Contribution Plan
  const empowerContribution=Math.max(0,num("empowerContribution"));
  const empowerMatch=Math.min(empowerContribution*.50,7.50);

  const match=mandatoryCountyMatch+voluntaryCountyMatch;
  const total=mandatory+voluntary+empowerContribution;

  return {
    mandatory,
    voluntary,
    mandatoryCountyMatch,
    voluntaryCountyMatch,
    match,
    empowerContribution,
    empowerMatch,
    total
  };
}
function calculate(){
 
const mode=document.querySelector('input[name="payMode"]:checked')?.value||"salary";

el("salaryBox").classList.toggle("hidden",mode!=="salary");
el("hourlyBox").classList.toggle("hidden",mode!=="hourly");

// Show the selected hourly paycheck calculation method


el("averageHoursBox").classList.toggle(
  "hidden", mode !== "hourly"
);


const hourlyRate=Math.max(0,num("hourlyRate"));


// Average paycheck estimate with separate overtime earnings
const averageRegularHours=Math.max(0,num("hoursWeek"));

const averageOvertimePay=Math.max(0,num("averageOvertimePay"));

const averageRegularGross=
  (hourlyRate*averageRegularHours*52)/PAY_PERIODS;

const averageOvertimeGross=
  (averageOvertimePay*52)/PAY_PERIODS;


const averageTotalGross=averageRegularGross+averageOvertimeGross;

text("averageRegularGross",money(averageRegularGross));


text("averageOvertimeGross",money(averageOvertimeGross));
text("averageTotalGross",money(averageTotalGross));

// Preserve existing annualized benefits calculations
const pay=getPay();


const isHourlyEstimate=mode==="hourly";


// Display the hourly earnings breakdown
// only when Hourly Rate is selected.
el("impactHourlyEarnings").classList.toggle(
  "hidden",!isHourlyEstimate
);

// All hourly estimates now use average earnings.
text(
  "impactHourlyEstimateType",
  "Average Paycheck Estimate"
);

text(
  "impactHourlyRegular",
  money(averageRegularGross)
);

text(
  "impactHourlyOvertime",
  money(averageOvertimeGross)
);

text(
  "impactHourlyTotal",
  money(averageTotalGross)
);

// Manual federal and Virginia income tax withholding
const federalWithholding=Math.max(0,num("federalWithholdingPerPay"));
const virginiaWithholding=Math.max(0,num("virginiaWithholdingPerPay"));

const manualIncomeTaxTotal=federalWithholding+virginiaWithholding;

text("manualIncomeTaxTotal",money(manualIncomeTaxTotal));

  
  text("grossPerPay",money(pay.gross));text("annualGross",money(pay.annual));text("monthlyGross",money(pay.monthly));text("hourlyEquivalent",money(pay.hourly));

  const futurePct=Math.max(0,num("futureIncreasePct"));
  const futureAnnual=pay.annual*(1+futurePct/100);
  const futureGross=futureAnnual/PAY_PERIODS;
  const futureHourly=pay.annualHours?futureAnnual/pay.annualHours:0;
  value("futureAnnualPay",money(futureAnnual));
  value("futureGrossPerPay",money(futureGross));
  value("futureHourlyRate",money(futureHourly));
  text("futureAnnualIncrease",money(futureAnnual-pay.annual));
  text("futurePerPayIncrease",money(futureGross-pay.gross));

  const age=ageAsOf(val("dob")),spouseAge=ageAsOf(val("spouseDob"));
  text("employeeAge",age==null?"—":String(age));text("spouseAge",spouseAge==null?"—":String(spouseAge));
  el("spouseDobWrap").classList.toggle("hidden",val("coverSpouse")!=="yes");
  el("ciSpouseWrap").classList.toggle("hidden",val("coverSpouse")!=="yes");
  if(val("coverSpouse")!=="yes"){value("ciSpouseCoverage","0");value("includeSpouseLife","no")}

  document.querySelectorAll(".benefit-toggle").forEach(ch=>el("section-"+ch.value)?.classList.toggle("visible",ch.checked));

  const c=benefitCosts(pay,age,spouseAge);
  const r=retirementCosts(pay);

  // Preliminary employee and County FICA estimates

 
/* Determine gross earnings for FICA calculations.
   Hourly employees: regular earnings plus entered overtime pay.
   Salaried employees: regular gross earnings.
*/
const ficaGross=mode==="hourly"
  ? averageTotalGross
  : pay.gross;


  // Assumed FICA-exempt benefit deductions.
  // These classifications must be confirmed with Payroll.
  const ficaPretaxDeductions=
    c.med+
    c.dent+
    c.vision+
    c.hsaEmp+
    c.healthFsa+
    c.limitedFsa+
    c.depFsa;

  // Retirement contributions are not deducted here.
  const ficaTaxableWages=Math.max(
    0,
    ficaGross-ficaPretaxDeductions
  );
text("ficaTaxableWagesPerPay",money(ficaTaxableWages));
const fica=estimateFica(ficaTaxableWages);

  if(fica){
    // Employee payroll taxes
    text("employeeSocialSecurity",money(fica.employeeSocialSecurity));
    text("employeeMedicare",money(fica.employeeMedicare));
    text("employeeAdditionalMedicare",money(fica.employeeAdditionalMedicare));
    text("employeeFicaTotal",money(fica.employeeFicaTotal));

    // County-paid payroll taxes
    text("countySocialSecurity",money(fica.countySocialSecurity));
    text("countyMedicare",money(fica.countyMedicare));
    text("countyFicaTotal",money(fica.countyFicaTotal));
  }

  text("medPerPay",money(c.med));text("medCountyPerPay",money(c.medCounty));
  text("dentPerPay",money(c.dent));text("dentCountyPerPay",money(c.dentCounty));
  text("visionPerPay",money(c.vision));
  text("hsaBasePerPay",money(c.hsaBase));text("hsaMatchPerPay",money(c.hsaMatch));text("hsaAnnualTotal",money((c.hsaEmp+c.hsaBase+c.hsaMatch)*PAY_PERIODS));
  const hsaLimit=(val("medicalCoverage")==="family"?8750:4400)+(age!=null&&age>=55?1000:0);
  const hsaProjected=(c.hsaEmp+c.hsaBase+c.hsaMatch)*PAY_PERIODS;
  const notice=el("hsaLimitNotice");
  if(hsaProjected>hsaLimit){notice.classList.remove("hidden");notice.textContent=`Estimated combined annual HSA contributions of ${money(hsaProjected)} exceed the applicable limit of ${money(hsaLimit)}.`}else{notice.classList.add("hidden");notice.textContent=""}

  const medPlan=val("medicalPlan");
  const medCoverage=val("medicalCoverage");
  const hsaCard=el("hsaAccountCard");
  const traditionalCard=el("traditionalFsaCard");
  const accountMessage=el("accountPlanMessage");

  hsaCard.classList.toggle("hidden",!(medPlan==="hsa"&&medCoverage!=="none"));
  traditionalCard.classList.toggle("hidden",!(medPlan==="traditional"&&medCoverage!=="none"));

  if(medPlan==="hsa"&&medCoverage!=="none"){
    value("healthFsaAnnual",0);
    el("healthFsaAnnual").disabled=true;
    el("limitedFsaAnnual").disabled=false;
    accountMessage.textContent="You selected the HSA Plan. Enter an HSA contribution and, if desired, a Limited Purpose FSA election for eligible dental and vision expenses.";
  }else if(medPlan==="traditional"&&medCoverage!=="none"){
    value("hsaEmployeePerPay",0);
    value("limitedFsaAnnual",0);
    el("hsaEmployeePerPay").disabled=true;
    el("limitedFsaAnnual").disabled=true;
    el("healthFsaAnnual").disabled=false;
    accountMessage.textContent="You selected the Traditional Plan. Enter a Health Care FSA annual election, if desired.";
  }else{
    value("hsaEmployeePerPay",0);
    value("healthFsaAnnual",0);
    value("limitedFsaAnnual",0);
    el("hsaEmployeePerPay").disabled=true;
    el("healthFsaAnnual").disabled=true;
    el("limitedFsaAnnual").disabled=true;
    accountMessage.textContent="Select medical coverage to display the compatible HSA or FSA entry fields.";
  }
  if(medPlan==="hsa"&&medCoverage!=="none") el("hsaEmployeePerPay").disabled=false;

  text("ciEmployeePerPay",money(c.ciEmp));text("ciSpousePerPay",money(c.ciSpouse));
  text("stdPerPay",money(c.std));text("stdMonthly",money(c.std*2));text("ltdPerPay",money(c.ltd));text("ltdMonthly",money(c.ltd*2));
  const plan=val("retirementPlan");
  const dis=el("disabilityEligibility");
  if(plan==="hybrid")dis.textContent="Hybrid Plan participants are eligible for voluntary STD and LTD only during the first year of service. After the one-year waiting period, the Hybrid Plan includes built-in disability coverage.";
  else dis.textContent="VRS Plan 1 and Plan 2 participants may enroll in and continue voluntary STD and LTD coverage each plan year.";

  text("lifeEmployeeCoverage",money(c.lifeEmpCov));text("lifeSpouseCoverage",money(c.lifeSpouseCov));text("lifeChildCoverage",money(c.lifeChildCov));
  text("lifeEmployeePerPay",money(c.lifeEmp));text("lifeSpousePerPay",money(c.lifeSpouse));text("lifeChildPerPay",money(c.lifeChild));
  const opt=Number(val("lifeOption")),eoi=el("lifeEoiNotice");
  if(!opt)eoi.textContent="Select an option to estimate coverage and premiums.";
  else if(opt<=4&&c.lifeEmpCov<=400000)eoi.textContent="New employees may generally elect employee options 1–4, up to $400,000, within 45 days without health questions. Spouse coverage beyond the option 1 guaranteed amount may require Evidence of Insurability.";
  else eoi.textContent="This election may require Evidence of Insurability and carrier approval before coverage becomes effective.";

  const accounts=c.hsaEmp+c.healthFsa+c.limitedFsa+c.depFsa;
  const critical=c.ciEmp+c.ciSpouse,disability=c.std+c.ltd,life=c.lifeEmp+c.lifeSpouse+c.lifeChild;
  text("boxMedical",money(c.med));text("boxDental",money(c.dent));text("boxVision",money(c.vision));text("boxAccounts",money(accounts));text("boxCritical",money(critical));text("boxDisability",money(disability));text("boxLife",money(life));text("boxTotal",money(c.total));

  const design=el("retirementDesign");
 if(plan==="plan1"){
  design.innerHTML=`
    <strong>VRS Plan 1</strong> is a Defined Benefit plan.
    You are covered under Plan 1 if your membership date is prior to July 1, 2010,
    and you were vested before January 1, 2013.
    Employees contribute a mandatory 5% of base gross income to the plan.
  `;
}

if(plan==="plan2"){
  design.innerHTML=`
    <strong>VRS Plan 2</strong> is a Defined Benefit plan.
    You are covered under Plan 2 if:
    <ul>
      <li>Your membership date is from July 1, 2010, to December 31, 2013.</li>
      <li>You have a membership date prior to July 1, 2010, but you were not vested before January 1, 2013.</li>
      <li>You are a Public Safety employee hired after July 1, 2010.</li>
    </ul>
    Employees contribute a mandatory 5% of base gross income to the plan.
  `;
}

if(plan==="hybrid"){
  design.innerHTML=`
    The <strong>Hybrid retirement plan</strong> is a Defined Benefit and a Defined Contribution plan.
    You are on the Hybrid plan if your membership is after January 1, 2014.
    Employees contribute 4% to the Defined Benefit component and 1% to the Defined Contribution component,
    for a total mandatory employee contribution of 5%.
  `;
}
  el("hybridVoluntaryCard").classList.toggle("hidden",plan!=="hybrid");
  text("retMandatoryPerPay",money(r.mandatory));text("retVoluntaryPerPay",money(r.voluntary+r.empowerContribution));text("retMatchPerPay",money(r.match+r.empowerMatch));text("empowerMatchPerPay",money(r.empowerMatch));

  const totalDed=c.total+r.total,after=pay.gross-totalDed,county=c.county+r.match+r.empowerMatch;
  
  // Annual Compensation and Benefits Summary

  const annualRewardsIsSpecific=false;

  // Base annual earnings exclude projected overtime.
  const annualRewardsBase=pay.annual;

  // Project qualifying overtime across 52 weeks.
  
const annualRewardsOvertime=mode==="hourly"
  ? Math.max(0,num("averageOvertimePay"))*52
  : 0;


  const annualRewardsGross=
    annualRewardsBase+annualRewardsOvertime;

  // Annualize County-paid benefits currently calculated.
  const annualRewardsBenefits=c.county*PAY_PERIODS;

  // County 401(a) contributions and Empower matching.
  const annualRewardsRetirement=
    (r.match+r.empowerMatch)*PAY_PERIODS;

  const annualRewardsCounty=
    annualRewardsBenefits+annualRewardsRetirement;

  const annualRewardsTotal=
    annualRewardsGross+annualRewardsCounty;

  // Specific paycheck amounts should not be used to
  // project annual compensation.
  if(annualRewardsIsSpecific){

    [
      "rewardsBaseAnnual",
      "rewardsOvertimeAnnual",
      "rewardsGrossAnnual",
      "rewardsBenefitsAnnual",
      "rewardsRetirementAnnual",
      "rewardsCountyBenefitsAnnual",
      "rewardsTotalAnnual"
    ].forEach(id=>text(id,"—"));

  }else{

    text("rewardsBaseAnnual",money(annualRewardsBase));
    text("rewardsOvertimeAnnual",money(annualRewardsOvertime));
    text("rewardsGrossAnnual",money(annualRewardsGross));

    text("rewardsBenefitsAnnual",money(annualRewardsBenefits));
    text("rewardsRetirementAnnual",money(annualRewardsRetirement));

    text("rewardsCountyBenefitsAnnual",money(annualRewardsCounty));
    text("rewardsTotalAnnual",money(annualRewardsTotal));

  }

  
  // Preliminary annual County FICA projection.
  // Uses a full calendar year of projected earnings and deductions.
  // Payroll must validate the pretax benefit classifications.

  const annualFicaTaxableWages=Math.max(
    0,
    Math.round(
      (annualRewardsGross - ficaPretaxDeductions * PAY_PERIODS) * 100
    ) / 100
  );

  // A full-year projection starts with zero prior-year wages.
  // The selected tax year determines the Social Security wage limit.
  
const annualCountyFica=estimateFica(
  annualFicaTaxableWages / PAY_PERIODS
);


  if(!annualRewardsIsSpecific && annualCountyFica){

const annualCountyFicaTotal=Math.round(
  (annualCountyFica.countyFicaTotal * PAY_PERIODS + Number.EPSILON) * 100
) / 100;


    const annualCountyInvestment=
      annualRewardsTotal+annualCountyFicaTotal;

    text(
      "rewardsCountyFicaAnnual",
      money(annualCountyFicaTotal)
    );

    text(
      "rewardsInvestmentAnnual",
      money(annualCountyInvestment)
    );

  }else{

    text("rewardsCountyFicaAnnual","—");
    text("rewardsInvestmentAnnual","—");

  }


  // Estimated take-home pay
  // Round displayed paycheck amounts consistently to cents.
  const roundPay = n =>
    Math.round((n + Number.EPSILON) * 100) / 100;

  
const takeHomeIsSpecific = false;

// Salaried employees use regular gross pay.
// Hourly employees use average regular and overtime earnings.
const estimatedGross = roundPay(
  mode === "hourly"
    ? averageTotalGross
    : pay.gross
);


  text("takeHomeGross", money(estimatedGross));

  if (takeHomeIsSpecific) {
    // Specific-paycheck deductions have not yet been validated.
    text("takeHomeDeductions", "—");
    text("takeHomeIncomeTax", "—");
    text("takeHomeFica", "—");
    text("takeHomePay", "—");

    text(
      "takeHomeNote",
      "The specific-paycheck gross earnings estimate is available. " +
      "Estimated take-home pay will be enabled after paycheck-specific " +
      "benefit and retirement deductions are validated."
    );
  } else {
    const selectedDeductions = roundPay(totalDed);
    const enteredIncomeTax = roundPay(manualIncomeTaxTotal);
    const employeeFicaAmount = fica
      ? roundPay(fica.employeeFicaTotal)
      : 0;

    const estimatedTakeHome = roundPay(
      estimatedGross -
      selectedDeductions -
      enteredIncomeTax -
      employeeFicaAmount
    );

    text("takeHomeDeductions", money(selectedDeductions));
    text("takeHomeIncomeTax", money(enteredIncomeTax));
    text("takeHomeFica", fica ? money(employeeFicaAmount) : "—");
    text("takeHomePay", fica ? money(estimatedTakeHome) : "—");

    text(
      "takeHomeNote",
      "This is an informational paycheck estimate. Federal and Virginia " +
      "withholding amounts are entered manually and do not automatically " +
      "adjust when earnings or benefits change. Actual pay may differ " +
      "due to other deductions, withholding elections, and payroll adjustments."
    );
  }
text("impactGross",money(pay.gross));text("impactBenefits",money(c.total));text("impactRetirement",money(r.total));text("impactTotalDeductions",money(totalDed));text("impactAfter",money(after));
  text("countyMedical",money(c.medCounty));text("countyDental",money(c.dentCounty));text("countyHsaBase",money(c.hsaBase));text("countyHsaMatch",money(c.hsaMatch));text("countyRetMatch",money(r.match+r.empowerMatch));text("countyTotal",money(county));
  text("sumAnnual",money(pay.annual));text("sumFuturePct",futurePct.toFixed(2)+"%");text("sumFutureAnnual",money(futureAnnual));text("sumGross",money(pay.gross));text("sumBenefits",money(c.total));text("sumRetirement",money(r.total));text("sumAfter",money(after));text("sumCounty",money(county));text("sumCountyAnnual",money(county*PAY_PERIODS));
}
function reset(){
  document.querySelector('input[name="payMode"][value="salary"]').checked=true;
  value("annualSalary",55000);value("hourlyRate",26.44);value("hoursWeek",40);value("futureIncreasePct",0);value("dob","");value("tobacco","non");value("coverSpouse","no");value("spouseDob","");
  value("medicalPlan","hsa");value("medicalCoverage","employee");value("dentalPlan","ppo1");value("dentalCoverage","employee");value("visionCoverage","employee");
  value("hsaEmployeePerPay",0);value("healthFsaAnnual",0);value("limitedFsaAnnual",0);value("dependentFsaAnnual",0);value("ciEmployeeCoverage","0");value("ciSpouseCoverage","0");
  value("stdEnroll","no");value("ltdEnroll","no");value("lifeOption","0");value("includeSpouseLife","no");value("includeChildLife","no");value("retirementPlan","hybrid");value("dcPercent","0");value("empowerContribution",0);
  document.querySelectorAll(".benefit-toggle").forEach(x=>x.checked=["medical","dental","vision"].includes(x.value));


  // Reset average weekly overtime pay
  value("averageOvertimePay", 0);


// Reset manually entered tax withholding
value("federalWithholdingPerPay", 0);
value("virginiaWithholdingPerPay", 0);


  calculate();showPanel("welcome");
}

function pdf(){
  calculate();

  if(!window.jspdf?.jsPDF){
    alert("PDF generator did not load. Use Print / Save as PDF instead.");
    return;
  }

  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:"pt",format:"letter"});

  const pageWidth=doc.internal.pageSize.getWidth();
  const pageHeight=doc.internal.pageSize.getHeight();
  const margin=42;
  let y=52;

  // Read values already calculated on the website.
  const getValue=id=>{
    const result=el(id)?.textContent?.trim();
    return !result||result==="—" ? "Not available" : result;
  };

  // Automatically create a new page if needed.
  const checkPage=height=>{
    if(y+height>pageHeight-65){
      doc.addPage();
      y=52;
    }
  };

  // Add a section heading.
  const addHeading=title=>{
    checkPage(40);
    y+=10;

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.setTextColor(11,79,125);
    doc.text(title,margin,y);

    y+=10;
    doc.setDrawColor(200,215,225);
    doc.line(margin,y,pageWidth-margin,y);
    y+=17;
  };

  // Add a label and its calculated value.
  const addRow=(label,value,bold=false)=>{
    doc.setFontSize(10);

    const labelLines=doc.splitTextToSize(label,350);
    const rowHeight=Math.max(18,labelLines.length*13+5);

    checkPage(rowHeight);

    doc.setFont("helvetica",bold?"bold":"normal");
    doc.setTextColor(30,45,60);

    doc.text(labelLines,margin,y);
    doc.text(
      String(value),
      pageWidth-margin,
      y,
      {align:"right"}
    );

    y+=rowHeight;
  };

  // Add explanatory information with automatic wrapping.
  const addNote=message=>{
    doc.setFont("helvetica","normal");
    doc.setFontSize(9);
    doc.setTextColor(85,95,105);

    const lines=doc.splitTextToSize(
      message,
      pageWidth-(margin*2)
    );

    lines.forEach(line=>{
      checkPage(14);
      doc.text(line,margin,y);
      y+=13;
    });

    y+=8;
  };


// Centered County logo and document heading


  // Embed the County logo directly from the saved image data.
  const logoData = window.JCC_COUNTY_LOGO;

  if (typeof logoData === "string" &&
      logoData.startsWith("data:image/jpeg;base64,")) {

    try {
      const logoProperties = doc.getImageProperties(logoData);

      const maxLogoWidth = 110;
      const maxLogoHeight = 65;

      const scale = Math.min(
        maxLogoWidth / logoProperties.width,
        maxLogoHeight / logoProperties.height
      );

      const logoWidth = logoProperties.width * scale;
      const logoHeight = logoProperties.height * scale;

      doc.addImage(
        logoData,
        "JPEG",
        (pageWidth - logoWidth) / 2,
        y,
        logoWidth,
        logoHeight
      );

      y += logoHeight + 20;

    } catch (error) {
      console.error("County logo could not be embedded.", error);
    }

  } else {
    console.warn("County logo data was not loaded.");
  }


// Center the main heading.
doc.setFont("helvetica", "bold");
doc.setTextColor(11, 79, 125);

doc.setFontSize(18);
doc.text(
  "James City County",
  pageWidth / 2,
  y,
  { align: "center" }
);

y += 24;

doc.setFontSize(15);
doc.text(
  "Interactive Benefits Calculator",
  pageWidth / 2,
  y,
  { align: "center" }
);

// Center the statement subtitle.
y += 24;

doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(70, 80, 90);



const pdfStatementTitle = "Estimated Total Compensation & Benefits Statement";


doc.text(
  pdfStatementTitle,
  pageWidth / 2,
  y,
  { align: "center" }
);

// Center the date.
y += 20;

doc.setFontSize(9);

doc.text(
  "Generated: " + new Date().toLocaleDateString("en-US"),
  pageWidth / 2,
  y,
  { align: "center" }
);

// Divider beneath the header.
y += 20;

doc.setDrawColor(200, 215, 225);
doc.line(
  margin,
  y,
  pageWidth - margin,
  y
);

y += 25;


  // Determine whether annual figures are available.
  
const payMode=document.querySelector(
  'input[name="payMode"]:checked'
)?.value||"salary";

// Temporary compatibility variable.
// Specific Paycheck Estimate has been removed.
const specificPaycheck=false;


// Show annual compensation sections only when applicable.
if (!specificPaycheck) {
  // Annual compensation
  addHeading("Annual Gross Earnings");

  if(specificPaycheck){
    addNote(
      "Annual compensation projections are not displayed " +
      "for a specific paycheck estimate. Select Average " +
      "Paycheck Estimate to view projected annual earnings."
    );
  }else{
    addRow(
      "Annual Base Gross Earnings",
      getValue("rewardsBaseAnnual")
    );

    addRow(
      "Projected Annual Overtime Earnings",
      getValue("rewardsOvertimeAnnual")
    );

    addRow(
      "Total Estimated Annual Gross Earnings",
      getValue("rewardsGrossAnnual"),
      true
    );
  }

  // County-paid benefits
  addHeading("Annual County Benefit Contributions");

  addRow(
    "County-Paid Healthcare and Other Selected Benefits",
    getValue("rewardsBenefitsAnnual")
  );

  addRow(
    "County Retirement Contributions and Matching",
    getValue("rewardsRetirementAnnual")
  );

  addRow(
    "Total Annual County Benefit Contributions",
    getValue("rewardsCountyBenefitsAnnual"),
    true
  );

  // Combined annual total
  addHeading("Total Annual Compensation & Benefits");

  addRow(
    "Combined Annual Compensation and Benefits",
    getValue("rewardsTotalAnnual"),
    true
  );

  addNote(
    "Includes only the County-paid benefits and retirement " +
    "contributions modeled by this calculator. Other benefits " +
    "and employer retirement costs may not be included."
  );

  // County payroll taxes
  addHeading("Additional County-Paid Payroll Taxes");

  addRow(
    "Estimated Annual County Social Security and Medicare",
    getValue("rewardsCountyFicaAnnual")
  );

  addRow(
    "Estimated Total Annual County Employment Investment",
    getValue("rewardsInvestmentAnnual"),
    true
  );

  addNote(
    "Employer-paid payroll taxes are additional County " +
    "employment expenses, not additional employee " +
    "compensation or benefits."
  );
}
  // Keep the paycheck information together on one page.
checkPage(220);

addHeading("Estimated Paycheck Information");

  addRow(
    "Estimated Gross Earnings Per Paycheck",
    getValue("takeHomeGross")
  );

  
if(specificPaycheck){

  addRow(
    "Estimated Employee Social Security and Medicare",
    getValue("employeeFicaTotal")
  );

  // Benefit and retirement estimates
  addHeading("Selected Benefits - Per-Pay Estimates");

  addRow(
    "Selected Employee Benefit Deductions",
    getValue("impactBenefits")
  );

  addRow(
    "Estimated Retirement Deductions - Base Pay Reference",
    getValue("impactRetirement")
  );

  // County-paid contributions
  addHeading("County Contributions - Per-Pay Estimates");

  addRow(
    "County Medical Contribution",
    getValue("countyMedical")
  );

  addRow(
    "County Dental Contribution",
    getValue("countyDental")
  );

  addRow(
    "County HSA Base Funding",
    getValue("countyHsaBase")
  );

  addRow(
    "County HSA Matching Contribution",
    getValue("countyHsaMatch")
  );

  addRow(
    "County 401(a) Retirement Matching",
    getValue("countyRetMatch")
  );

  addRow(
    "Total Estimated County Contributions",
    getValue("countyTotal"),
    true
  );

  addNote(
    "Benefit and retirement amounts reflect the employee's " +
    "selected elections and the calculator's regular-pay assumptions. " +
    "They are provided for reference and have not been adjusted " +
    "or validated for this specific paycheck."
  );

  addNote(
    "Estimated take-home pay is not yet available for specific " +
    "paycheck calculations. Actual deductions may vary based on " +
    "eligible earnings, benefit elections, and payroll rules."
  );

}else{

    
addRow(
  "Healthcare Deductions Per Paycheck",
  getValue("sumBenefits")
);

addRow(
  "Retirement Deductions Per Paycheck",
  getValue("sumRetirement")
);

addRow(
  "Total Selected Deductions",
  getValue("takeHomeDeductions"),
  true
);


    addRow(
      "Entered Federal and Virginia Income Tax Withholding",
      getValue("takeHomeIncomeTax")
    );

    addRow(
      "Estimated Employee Social Security and Medicare",
      getValue("takeHomeFica")
    );

    addRow(
      "Estimated Take-Home Pay Per Paycheck",
      getValue("takeHomePay"),
      true
    );
  }

// Keep the Important Information heading and notice together.
checkPage(105);

addHeading("Important Information");

  addNote(
    "This statement is for informational planning purposes " +
    "only and does not replace official County payroll " +
    "records available through MyJCC. Federal and Virginia " +
    "income tax withholding amounts are entered manually. " +
    "Social Security and Medicare estimates use applicable " +
    "rates, wage limits, and assumed pretax benefit deductions. " +
    "Actual compensation, deductions, and payroll tax amounts " +
    "may differ. Benefit tax treatment remains subject to " +
    "Payroll validation."
  );

  // Footer on every page
  const pageCount=doc.getNumberOfPages();

  for(let page=1;page<=pageCount;page++){
    doc.setPage(page);

    doc.setDrawColor(200,215,225);
    doc.line(
      margin,pageHeight-48,
      pageWidth-margin,pageHeight-48
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(8);
    doc.setTextColor(100,110,120);

    doc.text(
      "James City County | Informational Estimate",
      margin,pageHeight-34
    );

    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth-margin,
      pageHeight-34,
      {align:"right"}
    );
  }

  doc.save(
    "JCC_Interactive_Benefits_Calculator_Summary.pdf"
  );
}

document.addEventListener("DOMContentLoaded",()=>{
  buildNav();
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showPanel(t.dataset.panel)));
  el("mobileSection").addEventListener("change",e=>showPanel(e.target.value));
  document.querySelectorAll("input,select").forEach(x=>{if(x.id!=="mobileSection"){x.addEventListener("input",calculate);x.addEventListener("change",calculate)}});
  el("downloadPdf").addEventListener("click",pdf);
  el("resetForm").addEventListener("click",reset);
  el("backTop").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  calculate();
});
