import { Topic } from "@/data/centralData";

/**
 * Merges new topics with existing topics, avoiding duplicates
 * @param existingTopics Current topics in the system
 * @param newTopics Topics to be added
 * @returns Merged array of topics
 */
export const mergeTopics = (existingTopics: Topic[], newTopics: Topic[]): Topic[] => {
  console.log('Merging topics:', { existing: existingTopics.length, new: newTopics.length });
  
  // Create a map of existing topic IDs for quick lookup
  const existingIds = new Set(existingTopics.map(topic => topic.id));
  
  // Filter out topics with duplicate IDs and generate new IDs if needed
  const processedNewTopics = newTopics.map(topic => {
    if (existingIds.has(topic.id)) {
      // Generate a unique ID by appending a number
      const newId = generateUniqueId(topic.id, existingIds);
      console.log(`ID conflict resolved: ${topic.id} -> ${newId}`);
      existingIds.add(newId);
      return { ...topic, id: newId };
    }
    
    existingIds.add(topic.id);
    return topic;
  });
  
  // Merge the topics
  const mergedTopics = [...existingTopics, ...processedNewTopics];
  
  console.log('Topics merged successfully:', mergedTopics.length, 'total topics');
  return mergedTopics;
};

/**
 * Generates a unique ID by appending a numeric suffix
 * @param baseId The original ID
 * @param existingIds Set of existing IDs to check against
 * @returns A unique ID
 */
const generateUniqueId = (baseId: string, existingIds: Set<string>): string => {
  let counter = 1;
  let newId = `${baseId}-${counter}`;
  
  while (existingIds.has(newId)) {
    counter++;
    newId = `${baseId}-${counter}`;
  }
  
  return newId;
};

/**
 * Validates a topic structure
 * @param topic Topic to validate
 * @returns True if valid, throws error if invalid
 */
export const validateTopic = (topic: Topic): boolean => {
  if (!topic.id || typeof topic.id !== 'string') {
    throw new Error('Topic must have a valid ID');
  }
  
  if (!topic.label || typeof topic.label !== 'string') {
    throw new Error('Topic must have a valid label');
  }
  
  if (!topic.response || typeof topic.response !== 'string') {
    throw new Error('Topic must have a valid response');
  }
  
  // Validate subtopics if they exist
  if (topic.subTopics) {
    if (!Array.isArray(topic.subTopics)) {
      throw new Error('SubTopics must be an array');
    }
    
    topic.subTopics.forEach((subTopic, index) => {
      try {
        validateTopic(subTopic);
      } catch (error) {
        throw new Error(`Invalid subtopic at index ${index}: ${error}`);
      }
    });
  }
  
  return true;
};

/**
 * Validates an array of topics
 * @param topics Topics to validate
 * @returns True if all valid, throws error if any invalid
 */
export const validateTopics = (topics: Topic[]): boolean => {
  if (!Array.isArray(topics)) {
    throw new Error('Topics must be an array');
  }
  
  topics.forEach((topic, index) => {
    try {
      validateTopic(topic);
    } catch (error) {
      throw new Error(`Invalid topic at index ${index}: ${error}`);
    }
  });
  
  return true;
};
