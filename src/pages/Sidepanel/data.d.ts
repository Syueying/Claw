export type userDataType = {
    username: string;
    pwd: string;
    type: number;
}

export type crawlAccountType = {
    accountId: string;
    startDate: string;
    endDate: string;
}

export type HistoryDataType = {
    runId: number;
    accountId: string;
    startTime: string;
    endTime: string;
}