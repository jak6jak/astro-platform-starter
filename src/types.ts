export type BlobParameterProps = {
    seed: number;
    size: number;
    edges: number;
    growth: number;
    name: string;
    colors: string[];
};

export type BlobProps = {
    svgPath: string;
    parameters: BlobParameterProps;
};

export type Decision = {
    id: string;
    question: string;
    options: string[];
    createdAt: string;
};

export type Vote = {
    optionIndex: number;
    votedAt: string;
};

export type VoteTally = {
    option: string;
    count: number;
};

export type DecisionResults = {
    decision: Decision;
    tallies: VoteTally[];
    totalVotes: number;
    winner: VoteTally | null;
};
