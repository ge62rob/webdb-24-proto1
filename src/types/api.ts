export interface RxNormSuggestion {
  suggestionGroup: {
    suggestionList: {
      suggestion: string[];
    };
  };
}

export interface RxNormApproximate {
  approximateGroup: {
    candidate: Array<{
      rxcui: string;
      score: number;
      name: string;
    }>;
  };
}

export interface RxNormProperty {
  propConceptGroup: {
    propConcept: Array<{
      propName: string;
      propValue: string;
    }>;
  };
}

export interface RxNormClass {
  rxclassMinConceptList: Array<{
    classId: string;
    className: string;
    classType: string;
  }>;
}

export interface RxNormInteraction {
  interactionTypeGroup: Array<{
    interactionType: Array<{
      interactionPair: Array<{
        description: string;
        severity: string;
      }>;
    }>;
  }>;
}