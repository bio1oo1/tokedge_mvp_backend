const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'default',
  serviceId: 'tokedge-access',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

function insertEvent(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertEvent', inputVars, inputOpts);
}
exports.insertEvent = insertEvent;

function findInviteCodeByCode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FindInviteCodeByCode', inputVars, inputOpts);
}
exports.findInviteCodeByCode = findInviteCodeByCode;

function insertInviteCode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertInviteCode', inputVars, inputOpts);
}
exports.insertInviteCode = insertInviteCode;

function findLatestPortfolioByUserId(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FindLatestPortfolioByUserId', inputVars, inputOpts);
}
exports.findLatestPortfolioByUserId = findLatestPortfolioByUserId;

function insertPortfolioSnapshot(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertPortfolioSnapshot', inputVars, inputOpts);
}
exports.insertPortfolioSnapshot = insertPortfolioSnapshot;

function findUserByWalletHash(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FindUserByWalletHash', inputVars, inputOpts);
}
exports.findUserByWalletHash = findUserByWalletHash;

function findUserById(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FindUserById', inputVars, inputOpts);
}
exports.findUserById = findUserById;

function findUsersByReferredByInviteCode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FindUsersByReferredByInviteCode', inputVars, inputOpts);
}
exports.findUsersByReferredByInviteCode = findUsersByReferredByInviteCode;

function insertUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('InsertUser', inputVars, inputOpts);
}
exports.insertUser = insertUser;

function updateUserInviteCodeIssued(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateUserInviteCodeIssued', inputVars, inputOpts);
}
exports.updateUserInviteCodeIssued = updateUserInviteCodeIssued;

