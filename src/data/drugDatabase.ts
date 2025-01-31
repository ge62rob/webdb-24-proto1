/*
drugDatabase.ts

This might be redundant, but this code dynamically fills a list DRUG_LIST.
Algorithm: pull API_PULL_LIMIT amount of drugs from FDA API.
        If a single drug has a long name, split drug into
        two (or more) list items, with ', ' splitter.

If we cache drugs in database, will this code be redundant?
 */

import axios from "axios";

const API_PULL_LIMIT: number = 1000 as const;

export const fetchDrugNames = async (): Promise<string[]> => {
    try {
        const response = await axios.get("https://api.fda.gov/drug/label.json", {
            params: {
                search: "_exists_:openfda.generic_name",
                limit: API_PULL_LIMIT
            }
        });

        return response.data.results
            .flatMap((drug: any) => drug.openfda.generic_name?.[0].split(", ") || [])
            .filter(Boolean);
    } catch (error) {
        console.error("Error fetching drug names:", error);
        return [];
    }
};

export let DRUG_LIST: string[] = [];

fetchDrugNames().then(names => {
    DRUG_LIST = names;
    console.log("Drug list populated:", DRUG_LIST);
});
