import { useState } from 'react';
import { getRegionSpecies, getEcoregionInfo } from '@/services/mcpClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component to verify MCP server connection
 * Remove this component once testing is complete
 */
export const MCPTestComponent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testRegionSpecies = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getRegionSpecies({
        ecoregionName: 'Borneo',
        dietaryCategory: 'Carnivore',
        limit: 5
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testEcoregionInfo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getEcoregionInfo({
        ecoregionName: 'Borneo'
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🧪 MCP Server Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testRegionSpecies}
            disabled={loading}
          >
            Test Get Region Species
          </Button>
          <Button
            onClick={testEcoregionInfo}
            disabled={loading}
            variant="outline"
          >
            Test Get Ecoregion Info
          </Button>
        </div>

        {loading && (
          <div className="p-4 bg-blue-50 rounded">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="font-semibold text-red-800">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold text-green-800 mb-2">✅ Success!</p>
            <pre className="text-xs overflow-auto max-h-96 bg-white p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
