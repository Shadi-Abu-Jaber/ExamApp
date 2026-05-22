import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchResults } from '../../api/student';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import Input from '../../components/Input';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const loadResults = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchResults();
      setResults(res.data || []);
    } catch (err) {
      setResults([]);
      setError(err.response?.data?.message || 'Unable to load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const text = `${result.exam?.title || ''} ${result.exam?.description || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [results, search]);

  const stats = useMemo(() => {
    const gradedResults = results.filter(
      (result) =>
        result.totalScore !== null && result.totalScore !== undefined
    );

    const averageScore =
      gradedResults.length > 0
        ? gradedResults.reduce(
            (sum, result) => sum + Number(result.totalScore || 0),
            0
          ) / gradedResults.length
        : 0;

    const highestScore =
      gradedResults.length > 0
        ? Math.max(...gradedResults.map((result) => Number(result.totalScore || 0)))
        : 0;

    return {
      total: results.length,
      graded: gradedResults.length,
      averageScore: Number(averageScore.toFixed(2)),
      highestScore,
    };
  }, [results]);

  const getStatusVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    return 'default';
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <>
      <PageHeader
        title="My Results"
        subtitle="View published grades and feedback for your exams"
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">
            Published Results
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Graded Exams
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.graded}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Average Score
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.averageScore}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Highest Score
          </p>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {stats.highestScore}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <Input
          label="Search results"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by exam title or description..."
        />
      </Card>

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      ) : filteredResults.length ? (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <Card key={result.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(result.status)}>
                      {result.status}
                    </Badge>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Score:{' '}
                      {result.totalScore !== null &&
                      result.totalScore !== undefined
                        ? result.totalScore
                        : 'Pending'}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    {result.exam?.title || 'Untitled exam'}
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    {result.exam?.description || 'No description was provided.'}
                  </p>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Submitted
                      </p>
                      <p className="mt-1">{formatDate(result.submittedAt)}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Exam Duration
                      </p>
                      <p className="mt-1">
                        {result.exam?.durationMinutes || 0} minutes
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Result
                      </p>
                      <p className="mt-1">
                        {result.exam?.resultsPublished
                          ? 'Published'
                          : 'Not published'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 xl:w-40">
                  <Link to={`/student/results/${result.examId}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No results"
          description={
            results.length
              ? 'No results match your current search.'
              : 'No published results yet. Results will appear here after your lecturer publishes them.'
          }
        />
      )}
    </>
  );
};

export default StudentResults;