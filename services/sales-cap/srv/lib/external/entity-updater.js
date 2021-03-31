const moment = require('moment')


const _dateODataV2Pattern = /\/Date\(((?:-|)\d+)\)/
const _dateStringODataV2toV4 = ({srcStr, format = undefined}) => {
    if (srcStr) {
        const regRes = srcStr.match(_dateODataV2Pattern);
        if (regRes && regRes.length > 1) {
            const date = new Date(parseInt(regRes[1]))
            if (format) {
                const momentDate = moment(date)
                return momentDate.format(format)
            } else {
                return date.toISOString()
            }
        } else {
            const d = ""
        }
    }
    return srcStr
}

const HandlerEnum = Object.freeze({
    "updateByRemovingFieldsWithEmptyValue": () => {
        return (entity) => {
            Object.keys(entity).forEach(field => {
                const value = entity[field];
                if (value === undefined || value === null || value === '' || value.__deferred) {
                    delete entity[field]
                }
                if (value && value instanceof Array) {
                    value.forEach((elem) => {
                        HandlerEnum.updateByRemovingFieldsWithEmptyValue()(elem)
                        if (elem && elem.__metadata) {
                            delete elem.__metadata
                        }
                    })
                }
            });
            return entity
        }
    },
    "updateByRemovingFields": (fields = []) => {
        return (entity) => {
            if (fields && fields.length > 0) {
                fields.forEach(field => {
                    delete entity[field]
                })
                Object.keys(entity).forEach(field => {
                    const value = entity[field];
                    if (value && value instanceof Array) {
                        value.forEach((elem) => {
                            if (elem && elem instanceof Object) {
                                HandlerEnum.updateByRemovingFields(fields)(elem)
                            }
                        })
                    }
                });
            }
            return entity
        }
    },
    "dateODataV2toV4": (fields = []) => {
        return (entity) => {
            if (fields && fields.length > 0) {
                fields.forEach(item => {
                    const field = item[0]
                    const format = item[1]
                    if (entity[field]) {
                        entity[field] = _dateStringODataV2toV4({srcStr: entity[field], format: format})
                    }
                })
                Object.keys(entity).forEach(field => {
                    const value = entity[field];
                    if (value && value instanceof Array) {
                        value.forEach((elem) => {
                            if (elem && elem instanceof Object) {
                                HandlerEnum.dateODataV2toV4(fields)(elem)
                            }
                        })
                    }
                });
            }
            return entity
        }
    }
})

const ActionOnHandlers = (handlers) => {
    return (row) => {
        return handlers.reduce((param, handler) => handler(param), row)
    }
}


module.exports = {
    HandlerEnum, ActionOnHandlers
};
