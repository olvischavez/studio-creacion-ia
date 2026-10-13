export interface DynamicTopic {
  label: string;
  prompt: string;
  category?: string;
  topic?: string;
  scenario?: string;
}

export interface StrategyAnalysis {
  title: string;
  hook: string;
  contentCategory: string;
  recommendedFormat: string;
  dynamicRelatedTopics?: DynamicTopic[];
  youtubeStrategy: {
    titleIdea: string;
    thumbnailIdea: string;
    seoTags: string[];
    descriptionTemplate: string;
    retentionTechnique: string;
  };
  facebookStrategy: {
    titleIdea: string;
    hookStyle: string;
    viralShareTrigger: string;
    monetizationTip: string;
  };
  theMissingGap: {
    whatCompetitorsDo: string;
    whatNobodyHasUploaded: string;
    fusionOrImprovementAngle: string;
  };
  zeroBudgetProduction: {
    tabletRole: string;
    pcRole: string;
    freeTools: string[];
    stepByStepGuide: string[];
  };
  alternativeNiches: Array<{
    nicheName: string;
    whyItWorks: string;
    device: string;
  }>;
}

export interface ShotBreakdown {
  shotId: string;
  seconds: string;
  visualAction: string;
  narrationSnippet: string;
}

export interface FlowClip {
  clipNumber: number;
  timeRange: string;
  sceneTitle?: string;
  sceneTitleEnglish?: string;
  googleFlowPrompt: string;
  voiceoverSegmentSpanish: string;
  voiceoverSegmentEnglish?: string;
  shots: ShotBreakdown[];
  soundEffects: string;
}

export interface FlowChapter {
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEnglish?: string;
  timestamp: string;
  clips: FlowClip[];
}

export interface FlowDocumentary {
  documentaryTitle: string;
  documentaryTitleEnglish?: string;
  historicalTopic: string;
  estimatedDuration?: string;
  fullScriptCastilian: string;
  fullScriptEnglish?: string;
  totalClips?: number;
  chapters?: FlowChapter[];
  clips?: FlowClip[]; // For backwards compatibility or flat listing
  dynamicRelatedTopics?: Array<{ label: string; topic: string }>;
}

export interface POVScene {
  sceneNumber?: number;
  timestamp: string;
  povVisual: string;
  googleFlowPrompt: string;
  textOnScreen: string;
  audioAmbience: string;
  narration: string;
}

export interface POVShort {
  title: string;
  durationSeconds: number; // 20 - 30 seconds
  concept: string;
  historicalFactBehind: string;
  twistEnding: string;
  hookFirst3Sec: string;
  scenes: POVScene[]; // Exactly 4 scenes
  pinnedCommentStrategy: string;
  soundRecommendation: string;
  dynamicRelatedTopics?: Array<{ label: string; scenario: string }>;
}
