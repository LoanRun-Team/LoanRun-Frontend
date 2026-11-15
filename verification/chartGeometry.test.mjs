import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChartGeometry, clampPercent } from '../src/components/Charts/chartGeometry.js'

test('bar heights follow the supplied amount ratios',()=>{
  const result=buildChartGeometry({rows:[{principal:25,interest:25},{principal:75,interest:0}],maxValue:100,height:200})
  assert.equal(result.columns[0].principalHeight,50)
  assert.equal(result.columns[1].principalHeight,150)
})
test('cumulative line and bars follow every period, including changed period counts',()=>{
  const first=buildChartGeometry({rows:[{principal:10,plan:20},{principal:20,plan:40}],cumulative:true,maxValue:100,height:100,top:0})
  assert.equal(first.columns[1].principalHeight,30)
  assert.equal(first.columns[1].planY,40)
  const changed=buildChartGeometry({rows:[{principal:10,plan:30},{principal:20,plan:50},{principal:5,plan:10}],cumulative:true,maxValue:100,height:100,top:0})
  assert.equal(changed.columns.length,3)
  assert.notEqual(first.points,changed.points)
  assert.ok(Math.abs(changed.columns[2].planY-10)<1e-9)
})
test('axis expands for data above the supplied maximum without clipping',()=>{
  const result=buildChartGeometry({rows:[{principal:300,interest:200,plan:600}],maxValue:100,height:160,top:9})
  assert.equal(result.domain,600)
  assert.ok(result.columns[0].principalHeight+result.columns[0].interestHeight<=160)
  assert.equal(result.columns[0].planY,9)
})
test('empty and zero values have finite geometry; invalid inputs never produce NaN',()=>{
  for(const rows of [[],[{principal:0,interest:0,plan:0}],[{principal:NaN,interest:Infinity,plan:null}]]){
    const result=buildChartGeometry({rows,cumulative:true,target:0})
    assert.ok(Number.isFinite(result.domain))
    assert.ok(!result.points.includes('NaN'))
    for(const column of result.columns)assert.ok(Number.isFinite(column.planY))
  }
  assert.equal(clampPercent(-1),0)
  assert.equal(clampPercent(150),100)
})
