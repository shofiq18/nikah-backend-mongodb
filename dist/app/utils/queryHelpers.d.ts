export type TPaginationOptions = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};
export declare const QueryHelpers: {
    calculatePagination: (options: TPaginationOptions) => {
        page: number;
        limit: number;
        skip: number;
        sortBy: string;
        sortOrder: "asc" | "desc";
    };
};
