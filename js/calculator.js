const PAY_PERIODS=24;
const MONTHS=12;
const planYearDate=new Date("2026-07-01T00:00:00");
const rates={
  medical:{
    none:{emp:{none:0,employee:0,dual:0,family:0},county:{none:0,employee:0,dual:0,family:0}},
    hsa:{emp:{none:0,employee:51,dual:145,family:190},county:{none:0,employee:842,dual:1491,family:2019}},
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
  let voluntary=0,match=0;
  if(plan==="hybrid"){
    const pct=num("dcPercent");
    voluntary=pay.gross*pct/100;
    match=pay.gross*(rates.dcMatch[pct]||0)/100;
  }
  return {mandatory,voluntary,match,total:mandatory+voluntary};
}
function calculate(){
  const mode=document.querySelector('input[name="payMode"]:checked')?.value||"salary";
  el("salaryBox").classList.toggle("hidden",mode!=="salary");
  el("hourlyBox").classList.toggle("hidden",mode!=="hourly");
  const pay=getPay();
  value("annualHours",pay.annualHours.toFixed(0));
  value("grossPerPayInput",money(pay.gross));
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
  if(plan==="plan1")design.innerHTML="<strong>Plan 1:</strong> Defined Benefit plan. Membership generally began before July 1, 2010, with vesting as of January 1, 2013. Employees contribute a mandatory 5% of base gross income.";
  if(plan==="plan2")design.innerHTML="<strong>Plan 2:</strong> Defined Benefit plan. Membership generally began July 1, 2010 through December 31, 2013, or earlier without vesting by January 1, 2013. Employees contribute a mandatory 5% of base gross income.";
  if(plan==="hybrid")design.innerHTML="<strong>Hybrid:</strong> Includes Defined Benefit and Defined Contribution components. Employees contribute 4% to the Defined Benefit component and 1% to the mandatory Defined Contribution component, for a total mandatory employee contribution of 5%.";
  el("hybridVoluntaryCard").classList.toggle("hidden",plan!=="hybrid");
  text("retMandatoryPerPay",money(r.mandatory));text("retVoluntaryPerPay",money(r.voluntary));text("retMatchPerPay",money(r.match));

  const totalDed=c.total+r.total,after=pay.gross-totalDed,county=c.county+r.match;
  text("impactGross",money(pay.gross));text("impactBenefits",money(c.total));text("impactRetirement",money(r.total));text("impactTotalDeductions",money(totalDed));text("impactAfter",money(after));
  text("countyMedical",money(c.medCounty));text("countyDental",money(c.dentCounty));text("countyHsaBase",money(c.hsaBase));text("countyHsaMatch",money(c.hsaMatch));text("countyRetMatch",money(r.match));text("countyTotal",money(county));
  text("sumAnnual",money(pay.annual));text("sumFuturePct",futurePct.toFixed(2)+"%");text("sumFutureAnnual",money(futureAnnual));text("sumGross",money(pay.gross));text("sumBenefits",money(c.total));text("sumRetirement",money(r.total));text("sumAfter",money(after));text("sumCounty",money(county));text("sumCountyAnnual",money(county*PAY_PERIODS));
}
function reset(){
  document.querySelector('input[name="payMode"][value="salary"]').checked=true;
  value("annualSalary",55000);value("hourlyRate",26.44);value("hoursWeek",40);value("futureIncreasePct",0);value("dob","");value("tobacco","non");value("coverSpouse","no");value("spouseDob","");
  value("medicalPlan","hsa");value("medicalCoverage","employee");value("dentalPlan","ppo1");value("dentalCoverage","employee");value("visionCoverage","employee");
  value("hsaEmployeePerPay",0);value("healthFsaAnnual",0);value("limitedFsaAnnual",0);value("dependentFsaAnnual",0);value("ciEmployeeCoverage","0");value("ciSpouseCoverage","0");
  value("stdEnroll","no");value("ltdEnroll","no");value("lifeOption","0");value("includeSpouseLife","no");value("includeChildLife","no");value("retirementPlan","hybrid");value("dcPercent","0");
  document.querySelectorAll(".benefit-toggle").forEach(x=>x.checked=["medical","dental","vision"].includes(x.value));
  calculate();showPanel("pay");
}
function pdf(){
  calculate();
  if(!window.jspdf?.jsPDF){alert("PDF generator did not load. Use Print / Save as PDF instead.");return}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"pt",format:"letter"});
  const lines=[
    ["Annual gross pay",el("sumAnnual").textContent],["Gross pay per pay period",el("sumGross").textContent],
    ["Healthcare deductions per pay",el("sumBenefits").textContent],["Retirement deductions per pay",el("sumRetirement").textContent],
    ["Estimated pay before taxes",el("sumAfter").textContent],["County contributions per pay",el("sumCounty").textContent],
    ["Estimated annual County contributions",el("sumCountyAnnual").textContent]
  ];
  doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("James City County Interactive Benefits Calculator",48,54);
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.text("Informational estimate only. Official plan documents and payroll records control.",48,76);
  let y=110;lines.forEach(([a,b])=>{doc.setFont("helvetica","normal");doc.text(a,55,y);doc.setFont("helvetica","bold");doc.text(b,410,y);y+=24});
  doc.save("JCC_Interactive_Benefits_Calculator_Summary.pdf");
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
