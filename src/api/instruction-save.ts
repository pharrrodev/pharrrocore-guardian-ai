
import { Topic } from "@/data/centralData";
import { centralData } from "@/data/centralData";
import { mergeTopics } from "@/utils/topicsMerge";

export interface SaveInstructionsRequest {
  topics: Topic[];
}

export interface SaveInstructionsResponse {
  status: 'ok' | 'error';
  message?: string;
}

export const saveInstructions = async (
  request: SaveInstructionsRequest
): Promise<SaveInstructionsResponse> => {
  console.log('Saving instructions:', request.topics.length, 'topics');
  
  try {
    // Merge the new topics into the central data
    const mergedTopics = mergeTopics(centralData.assignmentTopics, request.topics);
    
    // Update the central data store
    centralData.assignmentTopics = mergedTopics;
    
    console.log('Successfully updated central data with', mergedTopics.length, 'total topics');
    
    return {
      status: 'ok',
      message: `Successfully saved ${request.topics.length} topics to assignment database`,
    };
  } catch (error) {
    console.error('Error saving instructions:', error);
    return {
      status: 'error',
      message: 'An unexpected error occurred while saving',
    };
  }
};
