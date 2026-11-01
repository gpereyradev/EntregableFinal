import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOperationKey} from '../src/operationKey.ts';
const payload={payment_method:'cash',items:[{product_id:17,quantity:2}]};
test('lost response: unchanged sale reuses its original UUID',()=>{
 const key=createOperationKey();const original=key(payload);
 assert.match(original,/^[0-9a-f-]{36}$/);
 assert.equal(key(structuredClone(payload)),original);
});
test('a changed cart is a different user intent',()=>{
 const key=createOperationKey();const original=key(payload);
 assert.notEqual(key({...payload,items:[{product_id:17,quantity:3}]}),original);
});
test('two completed identical purchases produce two different UUIDs',()=>{
 const key=createOperationKey();const first=key(payload);
 key.complete();const second=key(payload);
 assert.notEqual(second,first);assert.equal(key(payload),second);
});
